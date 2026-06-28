<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashierSession extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'starting_cash',
        'expected_ending_cash',
        'actual_ending_cash',
        'difference',
        'status',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'starting_cash' => 'decimal:2',
            'expected_ending_cash' => 'decimal:2',
            'actual_ending_cash' => 'decimal:2',
            'difference' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function sessionProducts(): HasMany
    {
        return $this->hasMany(CashierSessionProduct::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
