<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cashier_session_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashier_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('starting_packs');
            $table->integer('starting_quantity'); // in pcs (starting_packs * conversion_value)
            $table->integer('sold_quantity')->default(0); // in pcs
            $table->integer('actual_ending_packs')->nullable();
            $table->integer('actual_ending_loose_pcs')->nullable();
            $table->integer('actual_ending_quantity')->nullable(); // in pcs
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashier_session_products');
    }
};
