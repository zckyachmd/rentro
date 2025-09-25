<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Room> $rooms
 */
class Amenity extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $fillable = [
        'name',
        'icon',
        'category',
        'name_i18n',
    ];

    protected $casts = [
        'name_i18n' => 'array',
    ];

    protected function normalizeLocale(string $locale): string
    {
        $l    = strtolower(trim($locale));
        $base = explode('-', $l)[0] ?? $l;

        return $base ?: $l;
    }

    /** Ensure name is resolved from i18n map when reading. */
    /**
     * Resolve display name based on current locale from name_i18n map,
     * falling back to the raw 'name' column.
     */
    public function getNameAttribute($value): ?string
    {
        $fallback = is_string($value) ? $value : null;
        try {
            $map    = (array) ($this->attributes['name_i18n'] ?? []);
            $locale = (string) app()->getLocale();
            $base   = strtolower(explode('-', $locale)[0] ?? '');
            if (isset($map[$locale]) && is_string($map[$locale]) && $map[$locale] !== '') {
                return $map[$locale];
            }
            if ($base && isset($map[$base]) && is_string($map[$base]) && $map[$base] !== '') {
                return $map[$base];
            }
        } catch (\Throwable) {
            // ignore
        }

        return $fallback;
    }

    /** Keep name_i18n normalized and keep fallback name in sync. */
    public function setNameI18nAttribute($value): void
    {
        $map = [];
        if (is_array($value)) {
            foreach ($value as $k => $v) {
                if (!is_string($k)) {
                    continue;
                }
                $key = $this->normalizeLocale($k);
                $val = is_string($v) ? trim($v) : '';
                if ($val !== '') {
                    $map[$key] = $val;
                }
            }
        }
        // Persist normalized map
        $this->attributes['name_i18n'] = json_encode($map, JSON_UNESCAPED_UNICODE);

        // Determine fallback name: prefer app locale, then fallback locale, then first available
        $fallback = null;
        try {
            $curr = $this->normalizeLocale((string) app()->getLocale());
            $fb   = $this->normalizeLocale((string) (config('app.fallback_locale') ?? 'id'));
            if (isset($map[$curr])) {
                $fallback = $map[$curr];
            } elseif (isset($map[$fb])) {
                $fallback = $map[$fb];
            } elseif (!empty($map)) {
                $fallback = (string) reset($map);
            }
        } catch (\Throwable) {
            // ignore
        }
        if (is_string($fallback) && $fallback !== '') {
            $this->attributes['name'] = $fallback;
        }
    }

    /** When setting raw name, also seed name_i18n for current locale if empty. */
    public function setNameAttribute($value): void
    {
        $val                      = is_string($value) ? trim($value) : null;
        $this->attributes['name'] = $val;

        // also inject into i18n if missing
        try {
            $map  = (array) json_decode((string) ($this->attributes['name_i18n'] ?? '[]'), true);
            $curr = $this->normalizeLocale((string) app()->getLocale());
            if ($val && (!isset($map[$curr]) || $map[$curr] === '')) {
                $map[$curr]                    = $val;
                $this->attributes['name_i18n'] = json_encode($map, JSON_UNESCAPED_UNICODE);
            }
        } catch (\Throwable) {
            // ignore
        }
    }

    public function rooms()
    {
        return $this->belongsToMany(Room::class);
    }
}
