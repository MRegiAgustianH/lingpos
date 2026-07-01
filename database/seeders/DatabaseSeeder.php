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
        $gudang = Branch::create(['name' => 'Gudang (Pusat Stock)', 'address' => 'Kawasan Pergudangan No. 5', 'phone' => '08111111111']);
        $cabangPusat = Branch::create(['name' => 'Cabang Dapet', 'address' => 'Jl. Utama No. 1', 'phone' => '08123456789']);
        $cabangJakarta = Branch::create(['name' => 'Cabang MY', 'address' => 'Jl. Jakarta No. 10', 'phone' => '08198765432']);

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
            'branch_id' => null, // Kasir Ani starts with no branch assigned
        ]);

        // === 3. Kategori ===
        $katDimsum = Category::create(['name' => 'Dimsum']);
        $katMinuman = Category::create(['name' => 'Minuman']);
        $katPendukung = Category::create(['name' => 'Bahan Pendukung']);

        // === 4. Satuan ===
        $pcs = Unit::create(['name' => 'pcs']);
        $pack = Unit::create(['name' => 'pack']);
        $botol = Unit::create(['name' => 'botol']);
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

        $saus = Product::create([
            'name' => 'Saus Sambal Botol',
            'price' => 12000,
            'sku' => 'BP001',
            'category_id' => $katPendukung->id,
            'base_unit_id' => $botol->id,
        ]);

        $boxMentai = Product::create([
            'name' => 'Box Mentai',
            'price' => 1500,
            'sku' => 'BP002',
            'category_id' => $katPendukung->id,
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

        // Konversi: 1 pack saus = 10 botol
        ProductUnit::create([
            'product_id' => $saus->id,
            'unit_id' => $pack->id,
            'conversion_value' => 10,
        ]);

        // Konversi: 1 pack box = 50 pcs
        ProductUnit::create([
            'product_id' => $boxMentai->id,
            'unit_id' => $pack->id,
            'conversion_value' => 50,
        ]);

        // === 6. Inventory (stok per cabang) ===
        // Gudang starts with large stocks
        Inventory::create(['branch_id' => $gudang->id, 'product_id' => $sosis->id, 'stock' => 1000]);
        Inventory::create(['branch_id' => $gudang->id, 'product_id' => $kepiting->id, 'stock' => 1000]);
        Inventory::create(['branch_id' => $gudang->id, 'product_id' => $keju->id, 'stock' => 1000]);
        Inventory::create(['branch_id' => $gudang->id, 'product_id' => $ayam->id, 'stock' => 1000]);
        Inventory::create(['branch_id' => $gudang->id, 'product_id' => $udang->id, 'stock' => 1000]);
        Inventory::create(['branch_id' => $gudang->id, 'product_id' => $saus->id, 'stock' => 100]);
        Inventory::create(['branch_id' => $gudang->id, 'product_id' => $boxMentai->id, 'stock' => 500]);

        // Branch-cabang start with 0 stock (stok ditarik dari Gudang saat buka shift)
        foreach ([$cabangPusat, $cabangJakarta] as $branch) {
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $sosis->id, 'stock' => 0]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $kepiting->id, 'stock' => 0]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $keju->id, 'stock' => 0]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $ayam->id, 'stock' => 0]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $udang->id, 'stock' => 0]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $saus->id, 'stock' => 0]);
            Inventory::create(['branch_id' => $branch->id, 'product_id' => $boxMentai->id, 'stock' => 0]);
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
