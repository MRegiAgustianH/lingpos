<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Inventory;
use App\Models\Menu;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\TransactionItemDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $activeSession = null;
        if ($user->isKasir()) {
            $activeSession = \App\Models\CashierSession::where('user_id', $user->id)
                ->where('branch_id', $branchId)
                ->where('status', 'open')
                ->first();

            if (!$activeSession) {
                return redirect()->route('cashier.session')->with('error', 'Anda harus membuka sesi kasir (shift) terlebih dahulu.');
            }
        }

        $menus = Menu::with(['category', 'menuItems.product.baseUnit'])->get();

        // Get inventory for this branch to show stock availability
        $inventories = Inventory::where('branch_id', $branchId)
            ->get()
            ->keyBy('product_id');

        // Fetch products with their base unit and conversion units
        $products = \App\Models\Product::with(['baseUnit', 'productUnits.unit'])->get();

        return Inertia::render('pos/index', [
            'menus' => $menus,
            'categories' => Category::all(),
            'inventories' => $inventories,
            'branchId' => $branchId,
            'activeSession' => $activeSession,
            'products' => $products,
        ]);
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'nullable|exists:menus,id',
            'items.*.menu_name' => 'nullable|string',
            'items.*.price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.details' => 'required|array|min:1',
            'items.*.details.*.product_id' => 'required|exists:products,id',
            'items.*.details.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|in:cash,transfer',
            'amount_paid' => 'required|numeric|min:0',
            'jenis_order' => 'required|in:dine_in,take_away,gofood,grabfood,shopeefood',
            'waktu_order' => 'nullable',
        ]);

        $user = $request->user();
        $branchId = $user->branch_id;

        // Check if there is an active session for kasir
        $activeSession = null;
        if ($user->isKasir()) {
            $activeSession = \App\Models\CashierSession::where('user_id', $user->id)
                ->where('branch_id', $branchId)
                ->where('status', 'open')
                ->first();

            if (!$activeSession) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Sesi kasir aktif tidak ditemukan. Harap buka sesi kasir terlebih dahulu.',
                ]);
            }
        }

        return DB::transaction(function () use ($validated, $user, $branchId, $activeSession) {
            // Calculate total
            // Step 1: Calculate Total & Aggregate Required Ingredients
            $total = 0;
            $itemsData = [];
            $requiredProducts = [];

            foreach ($validated['items'] as $item) {
                if (!empty($item['menu_id'])) {
                    $menu = Menu::findOrFail($item['menu_id']);
                    $itemPrice = isset($item['price']) ? (float)$item['price'] : (float)$menu->price;
                    $itemName = $menu->name;
                } else {
                    $itemPrice = (float)$item['price'];
                    $itemName = $item['menu_name'] ?? 'Dimsum Frozen';
                }

                $subtotal = $itemPrice * $item['quantity'];
                $total += $subtotal;

                $itemsData[] = [
                    'menu_id' => $item['menu_id'] ?? null,
                    'menu_name' => $itemName,
                    'price' => $itemPrice,
                    'quantity' => $item['quantity'],
                    'subtotal' => $subtotal,
                    'details' => $item['details'],
                ];

                foreach ($item['details'] as $detail) {
                    $productId = $detail['product_id'];
                    $totalRequired = $detail['quantity'] * $item['quantity'];

                    if (!isset($requiredProducts[$productId])) {
                        $requiredProducts[$productId] = 0;
                    }
                    $requiredProducts[$productId] += $totalRequired;
                }
            }

            // Step 2: Validate Stock Availability
            foreach ($requiredProducts as $productId => $totalQty) {
                $product = \App\Models\Product::findOrFail($productId);
                $inventory = Inventory::where('branch_id', $branchId)
                    ->where('product_id', $productId)
                    ->first();

                if (!$inventory || $inventory->stock < $totalQty) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => "Stok {$product->name} tidak mencukupi (Tersedia: " . ($inventory ? $inventory->stock : 0) . ", Butuh: {$totalQty}).",
                    ]);
                }
            }

            $change = max(0, $validated['amount_paid'] - $total);

            // Generate invoice number
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad(
                Transaction::whereDate('created_at', today())->count() + 1,
                4,
                '0',
                STR_PAD_LEFT
            );

            // Create transaction
            $transaction = Transaction::create([
                'invoice_number' => $invoiceNumber,
                'branch_id' => $branchId,
                'user_id' => $user->id,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'jenis_order' => $validated['jenis_order'],
                'waktu_order' => $validated['waktu_order'] ? \Carbon\Carbon::parse($validated['waktu_order']) : now(),
                'waktu_bayar' => now(),
                'cashier_session_id' => $activeSession ? $activeSession->id : null,
                'amount_paid' => $validated['amount_paid'],
                'change' => $change,
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

                // Save detail bahan & deduct inventory
                foreach ($itemData['details'] as $detail) {
                    $product = \App\Models\Product::findOrFail($detail['product_id']);
                    $totalQty = $detail['quantity'] * $itemData['quantity'];

                    TransactionItemDetail::create([
                        'transaction_item_id' => $transactionItem->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'unit_id' => $product->base_unit_id,
                        'quantity' => $totalQty,
                    ]);

                    // Deduct inventory
                    Inventory::where('branch_id', $branchId)
                        ->where('product_id', $product->id)
                        ->decrement('stock', $totalQty);

                    // Update shift product sold quantity
                    if ($activeSession) {
                        \App\Models\CashierSessionProduct::where('cashier_session_id', $activeSession->id)
                            ->where('product_id', $product->id)
                            ->increment('sold_quantity', $totalQty);
                    }
                }
            }

            // --- Auto Inject into Cash Flow ---
            \App\Models\CashFlow::create([
                'branch_id' => $branchId,
                'user_id' => $user->id,
                'type' => 'income',
                'category' => 'penjualan_kasir',
                'amount' => $total,
                'description' => 'Otomatis dari Kasir (Invoice: ' . $invoiceNumber . ')',
                'transaction_date' => today(),
            ]);

            return redirect()->route('pos.index')->with('transaction', $transaction->load('transactionItems.transactionItemDetails'));
        });
    }

    public function receipt(Request $request, Transaction $transaction)
    {
        $transaction->load(['transactionItems.transactionItemDetails', 'branch', 'user']);
        return view('pos.receipt', compact('transaction'));
    }
}
