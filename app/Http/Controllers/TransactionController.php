<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::query()
            ->when($request->branch_id, fn($q, $v) => $q->where('branch_id', $v))
            ->when($request->date, fn($q, $v) => $q->whereDate('created_at', $v));

        $totalRevenue = $query->sum('total');

        $transactions = $query->with(['branch', 'user', 'transactionItems'])
            ->latest()
            ->paginate(20);

        return Inertia::render('transactions/index', [
            'transactions' => $transactions,
            'totalRevenue' => $totalRevenue,
            'branches' => Branch::all(),
            'filters' => $request->only(['branch_id', 'date']),
        ]);
    }

    public function show(Transaction $transaction)
    {
        $transaction->load(['branch', 'user', 'transactionItems.transactionItemDetails']);

        return Inertia::render('transactions/show', [
            'transaction' => $transaction,
        ]);
    }

    public function export(Request $request)
    {
        $transactions = Transaction::with(['branch', 'user'])
            ->when($request->branch_id, fn($q, $v) => $q->where('branch_id', $v))
            ->when($request->date, fn($q, $v) => $q->whereDate('created_at', $v))
            ->latest()
            ->get();

        $filename = "transaksi-" . date('Y-m-d') . ".csv";

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0",
        ];

        $columns = ['Invoice', 'Cabang', 'Kasir', 'Total', 'Bayar', 'Kembalian', 'Metode', 'Waktu'];

        $callback = function () use ($transactions, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($transactions as $t) {
                fputcsv($file, [
                    $t->invoice_number,
                    $t->branch ? $t->branch->name : '-',
                    $t->user ? $t->user->name : '-',
                    (int)$t->total,
                    (int)$t->amount_paid,
                    (int)$t->change,
                    strtoupper($t->payment_method),
                    $t->created_at->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
