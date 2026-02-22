<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->integer('stock')->default(0); // dalam base_unit (pcs)
            $table->timestamps();

            $table->unique(['branch_id', 'product_id']); // 1 record per cabang per produk
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
