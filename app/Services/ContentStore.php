<?php

namespace App\Services;

use App\Models\PageContent;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;

class ContentStore
{
    /**
     * Cache key: page:{page}:{locale}.
     */
    protected static function cacheKey(string $page, string $locale): string
    {
        return sprintf('page:%s:%s', $page, $locale);
    }

    /**
     * Get section values for page+section+locale as an associative array
     * shape: ['title' => '...', 'subtitle' => '...', ...].
     */
    public static function getSection(string $page, string $section, string $locale): array
    {
        $key = static::cacheKey($page, $locale);

        $all = Cache::rememberForever($key, function () use ($page, $locale) {
            $rows = PageContent::query()
                ->for($page, $locale, true)
                ->get(['section', 'key', 'value']);

            $grouped = [];
            foreach ($rows as $row) {
                $grouped[$row->section][$row->key] = $row->value;
            }

            return $grouped;
        });

        return (array) ($all[$section] ?? []);
    }

    /**
     * Set (upsert) multiple values for a section, then bust cache.
     */
    public static function setSection(string $page, string $section, string $locale, array $values): void
    {
        // Normalize values: keys as strings, values string|null
        $flat = [];
        foreach ($values as $k => $v) {
            $key        = is_int($k) ? (string) $k : (string) $k;
            $flat[$key] = is_null($v) ? null : (string) $v;
        }

        // Sync strategy: upsert provided keys and delete removed ones for this locale
        \DB::transaction(function () use ($page, $section, $locale, $flat): void {
            $existing = PageContent::query()
                ->where('page', $page)
                ->where('section', $section)
                ->where('locale', $locale)
                ->get(['id', 'key']);

            $existingKeys = $existing->pluck('key', 'id')->all();
            $keepKeys     = array_keys($flat);

            // Delete rows not present in payload
            $toDelete = [];
            foreach ($existingKeys as $id => $ek) {
                if (!in_array($ek, $keepKeys, true)) {
                    $toDelete[] = $id;
                }
            }
            if (!empty($toDelete)) {
                PageContent::query()->whereIn('id', $toDelete)->delete();
            }

            // Upsert values
            foreach ($flat as $k => $v) {
                PageContent::setValue($page, $section, $k, $locale, $v);
            }
        });

        Cache::forget(static::cacheKey($page, $locale));
    }

    /**
     * Helper to get known keys for a section, using existing records or defaults.
     */
    public static function knownKeys(string $page, string $section): array
    {
        $defaults = [
            'home' => [
                'hero'     => ['title', 'subtitle', 'cta_label'],
                'features' => ['title'],
            ],
            'about' => [
                'content' => ['body'],
            ],
            'privacy' => [
                'content' => ['body'],
            ],
        ];

        $existing = PageContent::query()
            ->where('page', $page)
            ->where('section', $section)
            ->distinct('key')
            ->pluck('key')
            ->filter()
            ->values()
            ->all();

        if (!empty($existing)) {
            return $existing;
        }

        return Arr::get($defaults, sprintf('%s.%s', $page, $section), []);
    }

    /**
     * Ensure keys structure is consistent across locales (create missing, delete removed).
     * Does not overwrite existing values.
     */
    public static function syncKeysStructureAcrossLocales(string $page, string $section, array $keys, array $locales = ['id', 'en']): void
    {
        $keys = array_values(array_unique(array_map('strval', $keys)));

        \DB::transaction(function () use ($page, $section, $keys, $locales): void {
            foreach ($locales as $locale) {
                $existing = PageContent::query()
                    ->where('page', $page)
                    ->where('section', $section)
                    ->where('locale', $locale)
                    ->get(['id', 'key']);

                $map = [];
                foreach ($existing as $row) {
                    $map[(string) $row->key] = (int) $row->id;
                }

                // Delete keys not desired
                $toDelete = [];
                foreach ($map as $k => $id) {
                    if (!in_array($k, $keys, true)) {
                        $toDelete[] = $id;
                    }
                }
                if (!empty($toDelete)) {
                    PageContent::query()->whereIn('id', $toDelete)->delete();
                }

                // Ensure all desired keys exist
                foreach ($keys as $k) {
                    if (!array_key_exists($k, $map)) {
                        PageContent::create([
                            'page'         => $page,
                            'section'      => $section,
                            'key'          => $k,
                            'locale'       => $locale,
                            'value'        => null,
                            'is_published' => true,
                        ]);
                    }
                }
            }
        });

        foreach ($locales as $loc) {
            Cache::forget(static::cacheKey($page, $loc));
        }
    }
}
