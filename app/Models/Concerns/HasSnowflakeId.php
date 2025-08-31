<?php

namespace App\Models\Concerns;

use Godruoyi\Snowflake\Snowflake;

trait HasSnowflakeId
{
    protected static ?Snowflake $__snowflake = null;

    public static function bootHasSnowflakeId(): void
    {
        static::creating(function ($model): void {
            if (!$model->getKey()) {
                $model->{$model->getKeyName()} = static::snowflake()->id();
            }
        });
    }

    protected static function snowflake(): Snowflake
    {
        if (static::$__snowflake instanceof Snowflake) {
            return static::$__snowflake;
        }
        $datacenter = (int) config('snowflake.datacenter_id', 1);
        $worker     = (int) config('snowflake.worker_id', 1);
        $epochMs    = (int) config('snowflake.epoch_ms', 1704067200000); // 2024-01-01 UTC

        $sf = new Snowflake($datacenter, $worker);
        if ($epochMs > 0) {
            $sf->setStartTimeStamp($epochMs);
        }
        static::$__snowflake = $sf;

        return $sf;
    }
}
