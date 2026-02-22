<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('id')->constrained('categories')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->after('category_id')->constrained('branches')->nullOnDelete();
            $table->string('sku', 50)->nullable()->after('name');
            $table->string('image')->nullable()->after('sku');
            $table->foreignId('base_unit_id')->nullable()->after('image')->constrained('units')->nullOnDelete();
            $table->dropColumn('stock');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['base_unit_id']);
            $table->dropColumn(['category_id', 'branch_id', 'sku', 'image', 'base_unit_id']);
            $table->integer('stock');
        });
    }
};
