<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::create('transaction_item_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_item_id')->constrained('transaction_items')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name'); // snapshot nama bahan
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->integer('quantity'); // berapa base_unit yang dipakai
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_item_details');
    }
};
