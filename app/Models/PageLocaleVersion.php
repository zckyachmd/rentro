<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageLocaleVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_locale_id', 'version', 'snapshot', 'user_id',
    ];

    protected $casts = [
        'snapshot' => 'array',
    ];

    public function pageLocale(): BelongsTo
    {
        return $this->belongsTo(PageLocale::class);
    }
}
