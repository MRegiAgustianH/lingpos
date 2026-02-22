<?php

namespace App\Http\Controllers;

use App\Models\CashFlow;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashFlowController extends Controller
{
    public function index(Request $request)
    {
        $query = CashFlow::with(['user', 'branch'])->latest('transaction_date')->latest('id');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('transaction_date', [$request->start_date, $request->end_date]);
        }

        $cashFlows = $query->paginate(20)->withQueryString();

        $summary = [
            'total_income' => CashFlow::where('type', 'income')->sum('amount'),
            'total_expense' => CashFlow::where('type', 'expense')->sum('amount'),
        ];
        $summary['net_flow'] = $summary['total_income'] - $summary['total_expense'];

        return Inertia::render('cash-flows/index', [
            'cashFlows' => $cashFlows,
            'summary' => $summary,
            'filters' => $request->only(['type', 'category', 'start_date', 'end_date']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:income,expense',
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'transaction_date' => 'required|date',
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['branch_id'] = $request->user()->branch_id;

        CashFlow::create($validated);

        return back()->with('success', 'Transaksi arus kas berhasil ditambahkan.');
    }

    public function destroy(CashFlow $cashFlow)
    {
        if ($cashFlow->category === 'penjualan_kasir') {
            return back()->with('error', 'Transaksi Penjualan Kasir tidak dapat dihapus dari menu Arus Kas. Silakan hapus/batalkan transaksi langsung dari modul riwayat Kasir.');
        }

        $cashFlow->delete();
        return back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
