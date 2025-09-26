<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PublicMenu extends Model
{
    protected $table = 'public_menus';

    protected $fillable = [
        'parent_id',
        'placement',
        'label',
        'label_i18n',
        'href',
        'icon',
        'target',
        'rel',
        'sort',
        'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'parent_id'  => 'integer',
        'sort'       => 'integer',
        'label_i18n' => 'array',
    ];

    protected function normalizeLocale(string $locale): string
    {
        $l    = strtolower(trim($locale));
        $base = explode('-', $l)[0] ?? $l;

        return $base ?: $l;
    }

    /** Normalize label_i18n map and sync fallback label. */
    public function setLabelI18nAttribute($value): void
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
        $this->attributes['label_i18n'] = json_encode($map, JSON_UNESCAPED_UNICODE);

        $fallback = null;
        try {
            $curr = $this->normalizeLocale((string) app()->getLocale());
            $fb   = $this->normalizeLocale((string) (config('app.fallback_locale') ?? 'en'));
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
            $this->attributes['label'] = $fallback;
        }
    }

    /** When setting raw label, seed label_i18n for current locale if missing. */
    public function setLabelAttribute($value): void
    {
        $val                       = is_string($value) ? trim($value) : null;
        $this->attributes['label'] = $val;
        try {
            $map  = (array) json_decode((string) ($this->attributes['label_i18n'] ?? '[]'), true);
            $curr = $this->normalizeLocale((string) app()->getLocale());
            if ($val && (!isset($map[$curr]) || $map[$curr] === '')) {
                $map[$curr]                     = $val;
                $this->attributes['label_i18n'] = json_encode($map, JSON_UNESCAPED_UNICODE);
            }
        } catch (\Throwable) {
            // ignore
        }
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort')->orderBy('id');
    }
}
