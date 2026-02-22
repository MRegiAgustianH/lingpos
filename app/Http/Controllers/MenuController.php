<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuController extends Controller
{
    public function index()
    {
        $menus = Menu::with(['category', 'menuItems.product'])->latest()->get();

        return Inertia::render('menus/index', [
            'menus' => $menus,
            'categories' => Category::all(),
            'products' => Product::with('baseUnit')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'is_flexible' => 'boolean',
            'default_quantity' => 'required|integer|min:1',
            'image' => 'nullable|image|max:2048',
            'items' => 'nullable|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('menus', 'public');
        }

        $menu = Menu::create([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'category_id' => $validated['category_id'] ?? null,
            'is_flexible' => $validated['is_flexible'] ?? false,
            'default_quantity' => $validated['default_quantity'],
            'image_path' => $imagePath,
        ]);

        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                MenuItem::create([
                    'menu_id' => $menu->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }
        }

        return redirect()->route('menus.index');
    }

    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'is_flexible' => 'boolean',
            'default_quantity' => 'required|integer|min:1',
            'image' => 'nullable|image|max:2048',
            'items' => 'nullable|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        if ($request->hasFile('image')) {
            if ($menu->image_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($menu->image_path);
            }
            $menu->image_path = $request->file('image')->store('menus', 'public');
        }

        $menu->update([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'category_id' => $validated['category_id'] ?? null,
            'is_flexible' => $validated['is_flexible'] ?? false,
            'default_quantity' => $validated['default_quantity'],
        ]);

        // Sync menu items
        $menu->menuItems()->delete();
        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                MenuItem::create([
                    'menu_id' => $menu->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }
        }

        return redirect()->route('menus.index');
    }

    public function destroy(Menu $menu)
    {
        $menu->delete();

        return redirect()->route('menus.index');
    }
}
