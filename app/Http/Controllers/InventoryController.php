<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $branchId = $request->branch_id ?? Branch::first()?->id;

        $inventories = Inventory::with(["product.baseUnit", "product.productUnits.unit", "branch"])
            ->when($branchId, fn ($q, $v) => $q->where("branch_id", $v))
            ->get();

        return Inertia::render("inventory/index", [
            "inventories" => $inventories,
            "branches" => Branch::all(),
            "products" => Product::with("baseUnit")->get(),
            "currentBranchId" => (int) $branchId,
        ]);
    }

    public function adjust(Request $request)
    {
        $validated = $request->validate([
            "branch_id" => "required|exists:branches,id",
            "product_id" => "required|exists:products,id",
            "quantity" => "required|integer",
            "unit_id" => "nullable|exists:units,id",
            "type" => "required|in:in,out",
        ]);

        $qty = $validated["quantity"];
        if ($validated["unit_id"]) {
            $productUnit = ProductUnit::where("product_id", $validated["product_id"])
                ->where("unit_id", $validated["unit_id"])
                ->first();
            if ($productUnit) {
                $qty = $qty * $productUnit->conversion_value;
            }
        }

        $inventory = Inventory::firstOrCreate(
            [
                "branch_id" => $validated["branch_id"],
                "product_id" => $validated["product_id"],
            ],
            ["stock" => 0]
        );

        if ($validated["type"] === "in") {
            $inventory->increment("stock", $qty);
        } else {
            $inventory->decrement("stock", min($qty, $inventory->stock));
        }

        return redirect()->route("inventory.index", ["branch_id" => $validated["branch_id"]]);
    }

        public function dailyRestock(Request $request)
    {
        $branchId = $request->user()->branch_id;
        
        $products = Product::with("baseUnit")->get();
        $inventories = Inventory::where('branch_id', $branchId)->get()->keyBy('product_id');

        return Inertia::render('inventory/daily-restock', [
            'products' => $products,
            'inventories' => $inventories,
        ]);
    }

    public function storeDailyRestock(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.stock' => 'required|integer|min:0',
        ]);

        $branchId = $request->user()->branch_id;

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $branchId) {
            foreach ($request->items as $item) {
                Inventory::updateOrCreate(
                    [
                        'branch_id' => $branchId,
                        'product_id' => $item['product_id'],
                    ],
                    [
                        'stock' => $item['stock']
                    ]
                );
            }
        });

        return redirect()->route('pos.index')->with('success', 'Stok hari ini berhasil disimpan.');
    }


    
}

