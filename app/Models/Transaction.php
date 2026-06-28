<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    protected $fillable = [
        'invoice_number',
        'branch_id',
        'user_id',
        'total',
        'payment_method',
        'jenis_order',
        'waktu_order',
        'waktu_bayar',
        'cashier_session_id',
        'amount_paid',
        'change',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'change' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactionItems(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function cashierSession(): BelongsTo
    {
        return $this->belongsTo(CashierSession::class);
    }
}
