<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Unit;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // === 1. Cabang ===
        $cabangPusat = Branch::create(['name' => 'Cabang Pusat', 'address' => 'Jl. Utama No. 1', 'phone' => '08123456789']);
        $cabangJakarta = Branch::create(['name' => 'Cabang Jakarta', 'address' => 'Jl. Jakarta No. 10', 'phone' => '08198765432']);

        // === 2. Admin & Kasir ===
        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@posling.com',
            'password' => 'password',
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Kasir Ani',
            'email' => 'kasir@posling.com',
            'password' => 'password',
            'role' => 'kasir',
            'branch_id' => $cabangJakarta->id,
        ]);

        // === 3. Kategori ===
        $katDimsum = Category::create(['name' => 'Dimsum']);
        $katMinuman = Category::create(['name' => 'Minuman']);

        // === 4. Satuan ===
        $pcs = Unit::create(['name' => 'pcs']);
        $pack = Unit::create(['name' => 'pack']);
        Unit::create(['name' => 'box']);
        Unit::create(['name' => 'lusin']);

        // === 5. Produk (Bahan Dasar) ===
        $sosis = Product::create([
            'name' => 'Dimsum Sosis',
            'price' => 2000,
            'sku' => 'DS001',
            'category_id' => $katDimsum->id,
            'base_unit_id' => $pcs->id,
        ]);

        $kepiting = Product::create([
            'name' => 'Dimsum Kepiting',
            'price' => 2000,
            'sku' => 'DS002',
            'category_id' => $katDimsum->id,
            'base_unit_id' => $pcs->id,
        ]);

        $keju = Product::create([
            'name' => 'Dimsum Keju',
            'price' => 2000,
            'sku' => 'DS003',
            'category_id' => $katDimsum->id,
            'base_unit_id' => $pcs->id,
        ]);

        $ayam = Product::create([
            'name' => 'Dimsum Ayam',
            'price' => 2000,
            'sku' => 'DS004',
            'category_id' => $katDimsum->id,
            'base_unit_id' => $pcs->id,
        ]);

        $udang = Product::create([
            'name' => 'Dimsum Udang',
            'price' => 2500,
            'sku' => 'DS005',
            'category_id' => $katDimsum->id,
            'base_unit_id' => $pcs->id,
        ]);

        // Konversi: 1 pack = 50 pcs
        foreach ([$sosis, $kepiting, $keju, $ayam, $udang] as $product) {
            ProductUnit::create([
                'product_id' => $product->id,
                'unit_id' => $pack->id,
                'conversion_value' => 50,
            ]);
        }

        // === 6. Inventory (stok per cabang) ===
        foreach ([$cabangPusat, $cabangJakarta] as $branch) {
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $sosis->id, 'stock' => 50]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $kepiting->id, 'stock' => 40]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $keju->id, 'stock' => 35]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $ayam->id, 'stock' => 30]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $udang->id, 'stock' => 25]);
        }

        // === 7. Menu (yang dijual di POS) ===
        $mentaiBiasa = Menu::create([
            'name' => 'Dimsum Mentai Biasa',
            'price' => 25000,
            'category_id' => $katDimsum->id,
            'is_flexible' => true,
            'default_quantity' => 3,
        ]);

        // Komposisi default
        MenuItem::create(['menu_id' => $mentaiBiasa->id, 'product_id' => $sosis->id, 'quantity' => 1]);
        MenuItem::create(['menu_id' => $mentaiBiasa->id, 'product_id' => $kepiting->id, 'quantity' => 1]);
        MenuItem::create(['menu_id' => $mentaiBiasa->id, 'product_id' => $keju->id, 'quantity' => 1]);

        $mentaiJumbo = Menu::create([
            'name' => 'Dimsum Mentai Jumbo',
            'price' => 45000,
            'category_id' => $katDimsum->id,
            'is_flexible' => true,
            'default_quantity' => 6,
        ]);

        MenuItem::create(['menu_id' => $mentaiJumbo->id, 'product_id' => $sosis->id, 'quantity' => 2]);
        MenuItem::create(['menu_id' => $mentaiJumbo->id, 'product_id' => $kepiting->id, 'quantity' => 2]);
        MenuItem::create(['menu_id' => $mentaiJumbo->id, 'product_id' => $keju->id, 'quantity' => 2]);

        $dimsumBakar = Menu::create([
            'name' => 'Dimsum Bakar',
            'price' => 28000,
            'category_id' => $katDimsum->id,
            'is_flexible' => false,
            'default_quantity' => 4,
        ]);

        MenuItem::create(['menu_id' => $dimsumBakar->id, 'product_id' => $sosis->id, 'quantity' => 2]);
        MenuItem::create(['menu_id' => $dimsumBakar->id, 'product_id' => $ayam->id, 'quantity' => 2]);

        Menu::create([
            'name' => 'Dimsum Sambal Matah',
            'price' => 30000,
            'category_id' => $katDimsum->id,
            'is_flexible' => true,
            'default_quantity' => 4,
        ]);
    }
}
