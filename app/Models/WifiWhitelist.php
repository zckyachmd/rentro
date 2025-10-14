<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WifiWhitelist extends Model
{
    protected $fillable = ['type', 'value', 'notes', 'meta'];

    protected $casts = [
        'meta' => 'array',
    ];
}
