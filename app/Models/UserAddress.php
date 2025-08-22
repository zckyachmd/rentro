<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAddress extends Model
{
    use HasFactory;
    use HasAudit;

    protected $fillable = [
        'user_id',
        'label',
        'address_line',
        'village',
        'district',
        'city',
        'province',
        'postal_code',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
