<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
    ];

    protected $casts = [
        'value' => 'json',
    ];

    /**
     * Single gateway for reading configuration with auto-casting based on the `type` column.
     *
     * @param string $key Configuration key
     * @param mixed $default Default value if not found
     * @return mixed
     */
    public static function config(string $key, mixed $default = null): mixed
    {
        $row = static::query()->where('key', $key)->first(['value', 'type']);
        if (!$row) {
            return $default;
        }

        $value = $row->value;
        $type  = strtolower((string) ($row->type ?? ''));

        if ($value === null) {
            return $default;
        }

        return match ($type) {
            'int', 'integer' => is_array($value) || is_object($value)
                ? (int) $default
                : (int) $value,
            'bool', 'boolean' => (
                is_array($value) || is_object($value)
            ) ? (bool) $default : (
                filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $value
            ),
            'string' => is_array($value) || is_object($value)
                ? (json_encode($value) ?: $default)
                : (string) $value,
            'array', 'json' => is_array($value) ? $value : $default,
            default => $value,
        };
    }
}
