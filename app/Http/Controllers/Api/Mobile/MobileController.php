<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CashFlow;
use App\Models\CashierSession;
use App\Models\CashierSessionProduct;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Menu;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\TransactionItemDetail;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MobileController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('branch'),
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        return response()->json([
            'today_sales' => Transaction::when($branchId, fn ($query) => $query->where('branch_id', $branchId))->whereDate('created_at', today())->sum('total'),
            'today_transactions' => Transaction::when($branchId, fn ($query) => $query->where('branch_id', $branchId))->whereDate('created_at', today())->count(),
            'low_stock_count' => Inventory::when($branchId, fn ($query) => $query->where('branch_id', $branchId))->where('stock', '<=', 5)->count(),
            'active_session' => $this->activeSession($user)?->load(['branch', 'sessionProducts.product.baseUnit', 'sessionProducts.product.productUnits.unit']),
        ]);
    }

    public function branches(): JsonResponse
    {
        return response()->json(['branches' => Branch::orderBy('name')->get()]);
    }

    public function menus(Request $request): JsonResponse
    {
        $branchId = $request->user()->branch_id;

        return response()->json([
            'menus' => Menu::with(['category', 'menuItems.product.baseUnit'])->orderBy('name')->get(),
            'categories' => Category::orderBy('name')->get(),
            'inventories' => Inventory::when($branchId, fn ($query) => $query->where('branch_id', $branchId))->get()->keyBy('product_id'),
        ]);
    }

    public function products(): JsonResponse
    {
        return response()->json([
            'products' => Product::with(['baseUnit', 'productUnits.unit'])->orderBy('name')->get(),
        ]);
    }

    public function inventory(Request $request): JsonResponse
    {
        $branchId = $request->user()->branch_id;

        return response()->json([
            'inventories' => Inventory::with(['product.baseUnit', 'branch'])
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->get(),
        ]);
    }

    public function currentSession(Request $request): JsonResponse
    {
        $session = $this->activeSession($request->user());
        $cashSales = $session
            ? Transaction::where('cashier_session_id', $session->id)->where('payment_method', 'cash')->sum('total')
            : 0;

        if ($session) {
            $session->expected_ending_cash = $session->starting_cash + $cashSales;
        }

        return response()->json([
            'is_open' => (bool) $session,
            'session' => $session?->load(['branch', 'sessionProducts.product.baseUnit', 'sessionProducts.product.productUnits.unit']),
            'products' => Product::with('baseUnit')->orderBy('name')->get(),
            'branches' => Branch::orderBy('name')->get(),
            'pack_unit_id' => Unit::where('name', 'pack')->value('id'),
        ]);
    }

    public function openSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'starting_cash' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.packs' => 'required|integer|min:0',
        ]);

        $user = $request->user();

        if ($this->activeSession($user)) {
            throw ValidationException::withMessages(['session' => 'Sesi kasir sebelumnya belum ditutup.']);
        }

        $session = DB::transaction(function () use ($validated, $user) {
            $branchId = $validated['branch_id'];
            $user->update(['branch_id' => $branchId]);

            $session = CashierSession::create([
                'user_id' => $user->id,
                'branch_id' => $branchId,
                'starting_cash' => $validated['starting_cash'],
                'expected_ending_cash' => $validated['starting_cash'],
                'status' => 'open',
                'opened_at' => now(),
            ]);

            CashFlow::create([
                'branch_id' => $branchId,
                'user_id' => $user->id,
                'type' => 'income',
                'category' => 'modal',
                'amount' => $validated['starting_cash'],
                'description' => 'Modal Awal Kasir Shift: ' . $user->name,
                'transaction_date' => today(),
            ]);

            $packUnit = Unit::where('name', 'pack')->first();
            $warehouseBranch = $this->warehouseBranch();

            foreach ($validated['items'] as $item) {
                $quantity = $item['packs'] * $this->packConversion($item['product_id'], $packUnit?->id);

                CashierSessionProduct::create([
                    'cashier_session_id' => $session->id,
                    'product_id' => $item['product_id'],
                    'starting_packs' => $item['packs'],
                    'starting_quantity' => $quantity,
                    'sold_quantity' => 0,
                ]);

                if ($warehouseBranch && $branchId !== $warehouseBranch->id) {
                    Inventory::firstOrCreate(['branch_id' => $warehouseBranch->id, 'product_id' => $item['product_id']], ['stock' => 0])->decrement('stock', $quantity);
                }

                Inventory::updateOrCreate(['branch_id' => $branchId, 'product_id' => $item['product_id']], ['stock' => $quantity]);
            }

            return $session;
        });

        return response()->json(['message' => 'Sesi kasir berhasil dibuka.', 'session' => $session->load(['branch', 'sessionProducts.product.baseUnit', 'sessionProducts.product.productUnits.unit'])], 201);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'nullable|exists:menus,id',
            'items.*.menu_name' => 'nullable|string',
            'items.*.price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.details' => 'nullable|array',
            'items.*.details.*.product_id' => 'required|exists:products,id',
            'items.*.details.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|in:cash,transfer',
            'amount_paid' => 'required|numeric|min:0',
            'jenis_order' => 'required|in:dine_in,take_away,gofood,grabfood,shopeefood',
            'waktu_order' => 'nullable',
        ]);

        $user = $request->user();
        $branchId = $user->branch_id;
        $activeSession = $user->isKasir() ? $this->activeSession($user) : null;

        if (! $branchId) {
            throw ValidationException::withMessages(['branch_id' => 'Cabang pengguna belum dipilih.']);
        }

        if ($user->isKasir() && ! $activeSession) {
            throw ValidationException::withMessages(['session' => 'Sesi kasir aktif tidak ditemukan.']);
        }

        $transaction = DB::transaction(function () use ($validated, $user, $branchId, $activeSession) {
            $total = 0;
            $itemsData = [];
            $requiredProducts = [];

            foreach ($validated['items'] as $item) {
                $menu = ! empty($item['menu_id']) ? Menu::with('menuItems')->findOrFail($item['menu_id']) : null;
                $itemPrice = isset($item['price']) ? (float) $item['price'] : (float) $menu->price;
                $itemName = $menu?->name ?? ($item['menu_name'] ?? 'Dimsum Frozen');
                $details = $item['details'] ?? [];

                if (empty($details) && $menu) {
                    $details = $menu->menuItems
                        ->map(fn ($menuItem) => [
                            'product_id' => $menuItem->product_id,
                            'quantity' => $menuItem->quantity,
                        ])
                        ->values()
                        ->all();
                }

                $subtotal = $itemPrice * $item['quantity'];
                $total += $subtotal;

                $itemsData[] = [
                    'menu_id' => $item['menu_id'] ?? null,
                    'menu_name' => $itemName,
                    'price' => $itemPrice,
                    'quantity' => $item['quantity'],
                    'subtotal' => $subtotal,
                    'details' => $details,
                ];

                foreach ($details as $detail) {
                    $requiredProducts[$detail['product_id']] = ($requiredProducts[$detail['product_id']] ?? 0) + ($detail['quantity'] * $item['quantity']);
                }
            }

            foreach ($requiredProducts as $productId => $totalQty) {
                $product = Product::findOrFail($productId);
                $inventory = Inventory::where('branch_id', $branchId)->where('product_id', $productId)->first();

                if (! $inventory || $inventory->stock < $totalQty) {
                    throw ValidationException::withMessages(['items' => "Stok {$product->name} tidak mencukupi (Tersedia: " . ($inventory ? $inventory->stock : 0) . ", Butuh: {$totalQty})."]);
                }
            }

            $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad(Transaction::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);
            $transaction = Transaction::create([
                'invoice_number' => $invoiceNumber,
                'branch_id' => $branchId,
                'user_id' => $user->id,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'jenis_order' => $validated['jenis_order'],
                'waktu_order' => ! empty($validated['waktu_order'] ?? null) ? \Carbon\Carbon::parse($validated['waktu_order']) : now(),
                'waktu_bayar' => now(),
                'cashier_session_id' => $activeSession?->id,
                'amount_paid' => $validated['amount_paid'],
                'change' => max(0, $validated['amount_paid'] - $total),
            ]);

            foreach ($itemsData as $itemData) {
                $transactionItem = TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'menu_id' => $itemData['menu_id'],
                    'menu_name' => $itemData['menu_name'],
                    'price' => $itemData['price'],
                    'quantity' => $itemData['quantity'],
                    'subtotal' => $itemData['subtotal'],
                ]);

                foreach ($itemData['details'] as $detail) {
                    $product = Product::findOrFail($detail['product_id']);
                    $totalQty = $detail['quantity'] * $itemData['quantity'];

                    TransactionItemDetail::create([
                        'transaction_item_id' => $transactionItem->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'unit_id' => $product->base_unit_id,
                        'quantity' => $totalQty,
                    ]);

                    Inventory::where('branch_id', $branchId)->where('product_id', $product->id)->decrement('stock', $totalQty);

                    if ($activeSession) {
                        CashierSessionProduct::where('cashier_session_id', $activeSession->id)->where('product_id', $product->id)->increment('sold_quantity', $totalQty);
                    }
                }
            }

            CashFlow::create([
                'branch_id' => $branchId,
                'user_id' => $user->id,
                'type' => 'income',
                'category' => 'penjualan_kasir',
                'amount' => $total,
                'description' => 'Otomatis dari Kasir (Invoice: ' . $invoiceNumber . ')',
                'transaction_date' => today(),
            ]);

            return $transaction;
        });

        return response()->json(['message' => 'Checkout berhasil.', 'transaction' => $transaction->load(['transactionItems.transactionItemDetails', 'branch', 'user'])], 201);
    }

    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeSession = $this->activeSession($user);

        $transactions = Transaction::with(['branch', 'user', 'transactionItems.transactionItemDetails'])
            ->when(
                $activeSession,
                fn ($query) => $query->where('cashier_session_id', $activeSession->id),
                fn ($query) => $query->when($user->branch_id, fn ($branchQuery) => $branchQuery->where('branch_id', $user->branch_id))
            )
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json($transactions);
    }

    public function receipt(Transaction $transaction): JsonResponse
    {
        return response()->json(['transaction' => $transaction->load(['transactionItems.transactionItemDetails', 'branch', 'user'])]);
    }

    public function closeSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'actual_ending_cash' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.packs' => 'required|integer|min:0',
            'items.*.pcs' => 'nullable|integer|min:0',
        ]);

        $user = $request->user();
        $session = $this->activeSession($user);

        if (! $session) {
            throw ValidationException::withMessages(['session' => 'Sesi kasir aktif tidak ditemukan.']);
        }

        DB::transaction(function () use ($validated, $session, $user) {
            $branchId = $session->branch_id;
            $cashSales = Transaction::where('cashier_session_id', $session->id)->where('payment_method', 'cash')->sum('total');
            $expectedEndingCash = $session->starting_cash + $cashSales;
            $warehouseBranch = $this->warehouseBranch();
            $packUnit = Unit::where('name', 'pack')->first();

            foreach ($validated['items'] as $item) {
                $quantity = ($item['packs'] * $this->packConversion($item['product_id'], $packUnit?->id)) + ($item['pcs'] ?? 0);

                CashierSessionProduct::where('cashier_session_id', $session->id)->where('product_id', $item['product_id'])->update([
                    'actual_ending_packs' => $item['packs'],
                    'actual_ending_loose_pcs' => $item['pcs'] ?? 0,
                    'actual_ending_quantity' => $quantity,
                ]);

                if ($warehouseBranch && $branchId !== $warehouseBranch->id) {
                    Inventory::firstOrCreate(['branch_id' => $warehouseBranch->id, 'product_id' => $item['product_id']], ['stock' => 0])->increment('stock', $quantity);
                    Inventory::updateOrCreate(['branch_id' => $branchId, 'product_id' => $item['product_id']], ['stock' => 0]);
                } else {
                    Inventory::updateOrCreate(['branch_id' => $branchId, 'product_id' => $item['product_id']], ['stock' => $quantity]);
                }
            }

            $session->update([
                'expected_ending_cash' => $expectedEndingCash,
                'actual_ending_cash' => $validated['actual_ending_cash'],
                'difference' => $validated['actual_ending_cash'] - $expectedEndingCash,
                'status' => 'closed',
                'closed_at' => now(),
            ]);

            $user->update(['branch_id' => null]);
        });

        return response()->json(['message' => 'Sesi kasir berhasil ditutup.', 'session' => $session->fresh(['branch', 'sessionProducts.product.baseUnit', 'sessionProducts.product.productUnits.unit'])]);
    }

    private function activeSession($user): ?CashierSession
    {
        return CashierSession::where('user_id', $user->id)->where('status', 'open')->first();
    }

    private function warehouseBranch(): ?Branch
    {
        return Branch::where('name', 'like', '%gudang%')
            ->orWhere('name', 'like', '%warehouse%')
            ->first() ?: (Branch::where('name', 'like', '%pusat%')->first() ?: Branch::first());
    }

    private function packConversion(int $productId, ?int $packUnitId): int
    {
        if (! $packUnitId) {
            return 1;
        }

        return ProductUnit::where('product_id', $productId)->where('unit_id', $packUnitId)->value('conversion_value') ?: 1;
    }
}








