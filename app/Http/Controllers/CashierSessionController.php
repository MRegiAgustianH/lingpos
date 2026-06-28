<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashFlow;
use App\Models\CashierSession;
use App\Models\CashierSessionProduct;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Transaction;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierSessionController extends Controller
{
    /**
     * Tampilkan status sesi kasir saat ini.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        // Cari sesi aktif
        $activeSession = CashierSession::where('user_id', $user->id)
            ->where('status', 'open')
            ->with(['sessionProducts.product'])
            ->first();

        // Cari semua produk bertipe dimsum/inventaris untuk input saat buka
        $products = Product::with('baseUnit')->get();
        $packUnit = Unit::where('name', 'pack')->first();
        $branches = Branch::all();

        if ($activeSession) {
            // Hitung uang cash yang diekspektasikan
            $cashSales = Transaction::where('cashier_session_id', $activeSession->id)
                ->where('payment_method', 'cash')
                ->sum('total');

            $activeSession->expected_ending_cash = $activeSession->starting_cash + $cashSales;

            return Inertia::render('pos/session', [
                'session' => $activeSession,
                'is_open' => true,
                'products' => $products,
                'packUnitId' => $packUnit?->id,
                'branches' => $branches,
            ]);
        }

        // Jika tidak ada sesi aktif, tampilkan form Buka Kasir
        return Inertia::render('pos/session', [
            'session' => null,
            'is_open' => false,
            'products' => $products,
            'packUnitId' => $packUnit?->id,
            'branches' => $branches,
        ]);
    }

    /**
     * Buka Sesi Kasir Baru.
     */
    public function open(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'starting_cash' => 'required|numeric|min:0',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.packs' => 'required|integer|min:0',
        ]);

        $branchId = $request->branch_id;

        // Pastikan tidak ada sesi yang masih open
        $existing = CashierSession::where('user_id', $user->id)
            ->where('status', 'open')
            ->exists();

        if ($existing) {
            return back()->with('error', 'Sesi kasir sebelumnya belum ditutup.');
        }

        DB::transaction(function () use ($request, $user, $branchId) {
            // Update user's current branch in database
            $user->update(['branch_id' => $branchId]);

            // 1. Create Sesi Kasir
            $session = CashierSession::create([
                'user_id' => $user->id,
                'branch_id' => $branchId,
                'starting_cash' => $request->starting_cash,
                'expected_ending_cash' => $request->starting_cash,
                'status' => 'open',
                'opened_at' => now(),
            ]);

            // 2. Catat modal di Arus Kas
            CashFlow::create([
                'branch_id' => $branchId,
                'user_id' => $user->id,
                'type' => 'income',
                'category' => 'modal',
                'amount' => $request->starting_cash,
                'description' => 'Modal Awal Kasir Shift: ' . $user->name,
                'transaction_date' => today(),
            ]);

            // Cari pack unit id untuk konversi
            $packUnit = Unit::where('name', 'pack')->first();

            // Find Gudang (Warehouse) branch
            $warehouseBranch = Branch::where('name', 'like', '%gudang%')
                ->orWhere('name', 'like', '%warehouse%')
                ->first();
            if (!$warehouseBranch) {
                $warehouseBranch = Branch::where('name', 'like', '%pusat%')->first() ?: Branch::first();
            }

            // 3. Simpan produk sesi dan update inventaris cabang
            foreach ($request->items as $item) {
                $productId = $item['product_id'];
                $packs = $item['packs'];

                $conversionValue = 1;
                if ($packUnit) {
                    $prodUnit = ProductUnit::where('product_id', $productId)
                        ->where('unit_id', $packUnit->id)
                        ->first();
                    if ($prodUnit) {
                        $conversionValue = $prodUnit->conversion_value;
                    }
                }

                $quantity = $packs * $conversionValue;

                // Simpan detail produk di sesi
                CashierSessionProduct::create([
                    'cashier_session_id' => $session->id,
                    'product_id' => $productId,
                    'starting_packs' => $packs,
                    'starting_quantity' => $quantity,
                    'sold_quantity' => 0,
                ]);

                // Deduct stock from Gudang if this is a sales branch
                if ($warehouseBranch && $branchId !== $warehouseBranch->id) {
                    $warehouseInv = Inventory::firstOrCreate(
                        [
                            'branch_id' => $warehouseBranch->id,
                            'product_id' => $productId,
                        ],
                        ['stock' => 0]
                    );
                    $warehouseInv->decrement('stock', $quantity);
                }

                // Overwrite stok cabang sesuai modal barang yang dibawa
                Inventory::updateOrCreate(
                    [
                        'branch_id' => $branchId,
                        'product_id' => $productId,
                    ],
                    [
                        'stock' => $quantity,
                    ]
                );
            }
        });

        return redirect()->route('pos.index')->with('success', 'Sesi kasir berhasil dibuka. Selamat bekerja!');
    }

    /**
     * Tutup Sesi Kasir.
     */
    public function close(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'actual_ending_cash' => 'required|numeric|min:0',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.packs' => 'required|integer|min:0',
            'items.*.pcs' => 'nullable|integer|min:0',
        ]);

        $session = CashierSession::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return back()->with('error', 'Sesi kasir aktif tidak ditemukan.');
        }

        $branchId = $session->branch_id;

        DB::transaction(function () use ($request, $session, $branchId, $user) {
            // 1. Hitung total penjualan cash selama shift ini
            $cashSales = Transaction::where('cashier_session_id', $session->id)
                ->where('payment_method', 'cash')
                ->sum('total');

            $expectedEndingCash = $session->starting_cash + $cashSales;
            $actualEndingCash = $request->actual_ending_cash;
            $difference = $actualEndingCash - $expectedEndingCash;

            // Cari pack unit id untuk konversi
            $packUnit = Unit::where('name', 'pack')->first();

            // Find Gudang (Warehouse) branch
            $warehouseBranch = Branch::where('name', 'like', '%gudang%')
                ->orWhere('name', 'like', '%warehouse%')
                ->first();
            if (!$warehouseBranch) {
                $warehouseBranch = Branch::where('name', 'like', '%pusat%')->first() ?: Branch::first();
            }

            // 2. Simpan sisa fisik produk (ending packs & loose pcs)
            foreach ($request->items as $item) {
                $productId = $item['product_id'];
                $packs = $item['packs'];
                $pcs = $item['pcs'] ?? 0;

                $conversionValue = 1;
                if ($packUnit) {
                    $prodUnit = ProductUnit::where('product_id', $productId)
                        ->where('unit_id', $packUnit->id)
                        ->first();
                    if ($prodUnit) {
                        $conversionValue = $prodUnit->conversion_value;
                    }
                }

                $quantity = ($packs * $conversionValue) + $pcs;

                // Update detail produk sesi
                $sessionProduct = CashierSessionProduct::where('cashier_session_id', $session->id)
                    ->where('product_id', $productId)
                    ->first();

                if ($sessionProduct) {
                    $sessionProduct->update([
                        'actual_ending_packs' => $packs,
                        'actual_ending_loose_pcs' => $pcs,
                        'actual_ending_quantity' => $quantity,
                    ]);
                }

                // Return remaining stock to Gudang, and set branch stock to 0
                if ($warehouseBranch && $branchId !== $warehouseBranch->id) {
                    $warehouseInv = Inventory::firstOrCreate(
                        [
                            'branch_id' => $warehouseBranch->id,
                            'product_id' => $productId,
                        ],
                        ['stock' => 0]
                    );
                    $warehouseInv->increment('stock', $quantity);

                    Inventory::updateOrCreate(
                        [
                            'branch_id' => $branchId,
                            'product_id' => $productId,
                        ],
                        [
                            'stock' => 0, // Branch returns everything to Gudang, so set stock to 0
                        ]
                    );
                } else {
                    // If this is the warehouse itself, update its stock directly
                    Inventory::updateOrCreate(
                        [
                            'branch_id' => $branchId,
                            'product_id' => $productId,
                        ],
                        [
                            'stock' => $quantity,
                        ]
                    );
                }
            }

            // 3. Update status sesi kasir menjadi closed
            $session->update([
                'expected_ending_cash' => $expectedEndingCash,
                'actual_ending_cash' => $actualEndingCash,
                'difference' => $difference,
                'status' => 'closed',
                'closed_at' => now(),
            ]);

            // Reset user's branch_id to null
            $user->update(['branch_id' => null]);
        });

        return redirect()->route('dashboard')->with('success', 'Sesi kasir berhasil ditutup. Rekapitulasi shift Anda telah disimpan.');
    }

    /**
     * Tampilkan riwayat shift untuk Admin.
     */
    public function indexAdmin()
    {
        $sessions = CashierSession::with(['user', 'branch', 'sessionProducts.product.baseUnit'])
            ->latest('opened_at')
            ->paginate(15);

        return Inertia::render('admin/shifts/index', [
            'sessions' => $sessions,
        ]);
    }
}
