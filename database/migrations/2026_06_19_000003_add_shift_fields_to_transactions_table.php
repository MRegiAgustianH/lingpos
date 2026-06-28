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
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('jenis_order', 50)->nullable()->after('payment_method'); // 'dine_in', 'take_away', 'gofood', 'grabfood', 'shopeefood'
            $table->timestamp('waktu_order')->nullable()->after('jenis_order');
            $table->timestamp('waktu_bayar')->nullable()->after('waktu_order');
            $table->foreignId('cashier_session_id')->nullable()->after('waktu_bayar')->constrained('cashier_sessions')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['cashier_session_id']);
            $table->dropColumn(['jenis_order', 'waktu_order', 'waktu_bayar', 'cashier_session_id']);
        });
    }
};
