<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    protected $fillable = [
        'menu_group_id',
        'parent_id',
        'label',
        'href',
        'icon',
        'permission_name',
        'allowed_roles',
        'excluded_roles',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'sort_order'     => 'integer',
        'meta'           => 'array',
        'allowed_roles'  => 'array',
        'excluded_roles' => 'array',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(MenuGroup::class, 'menu_group_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Menu::class, 'parent_id')->orderBy('sort_order');
    }
}
