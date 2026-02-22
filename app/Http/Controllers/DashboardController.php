<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Menu;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        // Today's sales
        $todaySales = Transaction::when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->whereDate('created_at', today())
            ->sum('total');

        $todayTransactions = Transaction::when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->whereDate('created_at', today())
            ->count();

        // Low stock items (< 10 pcs)
        $lowStockCount = Inventory::when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->where('stock', '<', 10)
            ->count();

        // Top menus (this week)
        $topMenus = TransactionItem::select('menu_name', DB::raw('SUM(quantity) as total_sold'))
            ->whereHas('transaction', function ($q) use ($branchId) {
            $q->when($branchId, fn($q2, $v) => $q2->where('branch_id', $v))
                ->where('created_at', '>=', now()->startOfWeek());
        })
            ->groupBy('menu_name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        // Low stock items list
        $lowStockItems = Inventory::with('product.baseUnit')
            ->when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->where('stock', '<', 10)
            ->get();

        // Weekly sales chart data
        $weeklySales = Transaction::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(total) as total')
        )
            ->when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Total Active Inventory Quantity
        $activeInventory = Inventory::when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->sum('stock');

        // Recent Transactions
        $recentTransactions = Transaction::when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->with(['transactionItems'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($transaction) {
            return [
            'id' => $transaction->id,
            'order_id' => '#ORD-' . str_pad($transaction->id, 5, '0', STR_PAD_LEFT),
            'customer_name' => $transaction->customer_name ?: 'Guest',
            'date' => $transaction->created_at->format('M d, h:i A'),
            'items_count' => $transaction->transactionItems->sum('quantity'),
            'total' => $transaction->total,
            'status' => 'Completed',
            ];
        });

        // Monthly Net Profit Calculation
        $monthlySales = Transaction::when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total');

        $monthlyCashIncome = \App\Models\CashFlow::when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->where('type', 'income')
            ->where('category', '!=', 'penjualan_kasir') // Cegah perhitungan ganda dengan tabel transactions
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $monthlyCashExpense = \App\Models\CashFlow::when($branchId, fn($q, $v) => $q->where('branch_id', $v))
            ->where('type', 'expense')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $thisMonthNetProfit = ($monthlySales + $monthlyCashIncome) - $monthlyCashExpense;

        return Inertia::render('dashboard', [
            'todaySales' => $todaySales,
            'thisMonthNetProfit' => $thisMonthNetProfit,
            'todayTransactions' => $todayTransactions,
            'lowStockCount' => $lowStockCount,
            'topMenus' => $topMenus,
            'lowStockItems' => $lowStockItems,
            'weeklySales' => $weeklySales,
            'activeInventory' => $activeInventory,
            'recentTransactions' => $recentTransactions,
            'isAdmin' => $user->isAdmin(),
        ]);
    }
}
