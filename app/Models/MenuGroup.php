<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuGroup extends Model
{
    protected $fillable = [
        'key',
        'label',
        'icon',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    public function menus(): HasMany
    {
        return $this->hasMany(Menu::class)->whereNull('parent_id')->orderBy('sort_order');
    }
}
