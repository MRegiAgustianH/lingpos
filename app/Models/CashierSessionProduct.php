<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashierSessionProduct extends Model
{
    protected $fillable = [
        'cashier_session_id',
        'product_id',
        'starting_packs',
        'starting_quantity',
        'sold_quantity',
        'actual_ending_packs',
        'actual_ending_loose_pcs',
        'actual_ending_quantity',
    ];

    public function cashierSession(): BelongsTo
    {
        return $this->belongsTo(CashierSession::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
