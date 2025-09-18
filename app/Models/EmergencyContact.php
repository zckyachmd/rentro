<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read User|null $user
 */
class EmergencyContact extends Model
{
    use HasFactory;
    use HasAudit;

    protected $fillable = [
        'user_id',
        'name',
        'relationship',
        'phone',
        'email',
        'address_line',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
