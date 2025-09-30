<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageContent extends Model
{
    use HasFactory;

    protected $table = 'page_contents';

    protected $fillable = [
        'page',
        'section',
        'key',
        'locale',
        'value',
        'is_published',
    ];

    /**
     * Scope: filter by page + locale (published only by default).
     */
    public function scopeFor(Builder $query, string $page, string $locale, bool $onlyPublished = true): Builder
    {
        $q = $query->where('page', $page)->where('locale', $locale);

        return $onlyPublished ? $q->where('is_published', true) : $q;
    }

    /**
     * Scope: filter by section.
     */
    public function scopeSection(Builder $query, string $section): Builder
    {
        return $query->where('section', $section);
    }

    /**
     * Get a single value by identifiers.
     */
    public static function getValue(
        string $page,
        string $section,
        string $key,
        string $locale,
        mixed $default = null,
        bool $onlyPublished = true,
    ): mixed {
        $row = static::query()
            ->for($page, $locale, $onlyPublished)
            ->section($section)
            ->where('key', $key)
            ->first();

        // Using -> with ?? is safe; ?? does not trigger errors when $row is null
        return $row->value ?? $default;
    }

    /**
     * Set or create a single value.
     */
    public static function setValue(
        string $page,
        string $section,
        string $key,
        string $locale,
        mixed $value,
        ?bool $isPublished = null,
    ): void {
        $row = static::query()->firstOrNew([
            'page'    => $page,
            'section' => $section,
            'key'     => $key,
            'locale'  => $locale,
        ]);

        $row->value = $value;
        if ($isPublished !== null) {
            $row->is_published = (bool) $isPublished;
        } elseif (!$row->exists) {
            $row->is_published = true;
        }
        $row->save();
    }
}
