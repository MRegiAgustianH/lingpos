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

        $menus = Menu::with(['category', 'menuItems.product.baseUnit'])->get();

        // Get inventory for this branch to show stock availability
        $inventories = Inventory::where('branch_id', $branchId)
            ->get()
            ->keyBy('product_id');

        return Inertia::render('pos/index', [
            'menus' => $menus,
            'categories' => Category::all(),
            'inventories' => $inventories,
            'branchId' => $branchId,
        ]);
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.details' => 'required|array|min:1',
            'items.*.details.*.product_id' => 'required|exists:products,id',
            'items.*.details.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|in:cash,transfer',
            'amount_paid' => 'required|numeric|min:0',
        ]);

        $user = $request->user();
        $branchId = $user->branch_id;

        return DB::transaction(function () use ($validated, $user, $branchId) {
            // Calculate total
            // Step 1: Calculate Total & Aggregate Required Ingredients
            $total = 0;
            $itemsData = [];
            $requiredProducts = [];

            foreach ($validated['items'] as $item) {
                $menu = Menu::findOrFail($item['menu_id']);
                $subtotal = $menu->price * $item['quantity'];
                $total += $subtotal;

                $itemsData[] = [
                    'menu' => $menu,
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
                'amount_paid' => $validated['amount_paid'],
                'change' => $change,
            ]);

            foreach ($itemsData as $itemData) {
                $transactionItem = TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'menu_id' => $itemData['menu']->id,
                    'menu_name' => $itemData['menu']->name,
                    'price' => $itemData['menu']->price,
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
}
