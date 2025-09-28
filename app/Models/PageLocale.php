<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PageLocale extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_id', 'locale', 'status', 'publish_at', 'unpublish_at',
        'title', 'description',
        'seo_draft', 'seo_published',
        'fields_draft', 'fields_published',
        'blocks_draft', 'blocks_published',
        'version',
    ];

    protected $casts = [
        'publish_at'       => 'datetime',
        'unpublish_at'     => 'datetime',
        'seo_draft'        => 'array',
        'seo_published'    => 'array',
        'fields_draft'     => 'array',
        'fields_published' => 'array',
        'blocks_draft'     => 'array',
        'blocks_published' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PageLocaleVersion::class);
    }

    public function activeFields(bool $preview = false): array
    {
        if ($preview) {
            return (array) ($this->fields_draft ?? []);
        }

        return (array) ($this->fields_published ?? []);
    }

    public function activeBlocks(bool $preview = false): array
    {
        if ($preview) {
            return (array) ($this->blocks_draft ?? []);
        }

        return (array) ($this->blocks_published ?? []);
    }
}
