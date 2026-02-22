<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with(['category', 'branch', 'baseUnit', 'productUnits.unit'])
            ->when($request->category_id, fn($q, $v) => $q->where('category_id', $v))
            ->when($request->branch_id, fn($q, $v) => $q->where('branch_id', $v))
            ->latest()
            ->get();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => Category::all(),
            'branches' => Branch::all(),
            'units' => Unit::all(),
            'filters' => $request->only(['category_id', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'sku' => 'nullable|string|max:50',
            'category_id' => 'nullable|exists:categories,id',
            'branch_id' => 'nullable|exists:branches,id',
            'base_unit_id' => 'nullable|exists:units,id',
            'product_units' => 'nullable|array',
            'product_units.*.unit_id' => 'required|exists:units,id',
            'product_units.*.conversion_value' => 'required|numeric|min:0.01',
        ]);

        $product = Product::create(\Illuminate\Support\Arr::except($validated, ['product_units']));

        if (!empty($validated['product_units'])) {
            foreach ($validated['product_units'] as $unit) {
                \App\Models\ProductUnit::create([
                    'product_id' => $product->id,
                    'unit_id' => $unit['unit_id'],
                    'conversion_value' => $unit['conversion_value'],
                ]);
            }
        }

        return redirect()->route('products.index');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'sku' => 'nullable|string|max:50',
            'category_id' => 'nullable|exists:categories,id',
            'branch_id' => 'nullable|exists:branches,id',
            'base_unit_id' => 'nullable|exists:units,id',
            'product_units' => 'nullable|array',
            'product_units.*.unit_id' => 'required|exists:units,id',
            'product_units.*.conversion_value' => 'required|numeric|min:0.01',
        ]);

        $product->update(\Illuminate\Support\Arr::except($validated, ['product_units']));

        $product->productUnits()->delete();
        if (!empty($validated['product_units'])) {
            foreach ($validated['product_units'] as $unit) {
                \App\Models\ProductUnit::create([
                    'product_id' => $product->id,
                    'unit_id' => $unit['unit_id'],
                    'conversion_value' => $unit['conversion_value'],
                ]);
            }
        }

        return redirect()->route('products.index');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('products.index');
    }
}
