<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('room_types', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedTinyInteger('capacity')->default(1);
            // Pricing and deposits as JSON per period: {"daily":12300,"weekly":70000,"monthly":300000}
            $table->json('prices')->nullable();
            $table->json('deposits')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("CREATE INDEX IF NOT EXISTS room_types_prices_daily_idx ON room_types (((prices->>'daily')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS room_types_prices_weekly_idx ON room_types (((prices->>'weekly')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS room_types_prices_monthly_idx ON room_types (((prices->>'monthly')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS room_types_deposits_daily_idx ON room_types (((deposits->>'daily')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS room_types_deposits_weekly_idx ON room_types (((deposits->>'weekly')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS room_types_deposits_monthly_idx ON room_types (((deposits->>'monthly')::bigint))");
        } elseif ($driver === 'mysql') {
            DB::statement("CREATE INDEX room_types_prices_daily_idx ON room_types ((CAST(JSON_UNQUOTE(JSON_EXTRACT(prices, '$.\"daily\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX room_types_prices_weekly_idx ON room_types ((CAST(JSON_UNQUOTE(JSON_EXTRACT(prices, '$.\"weekly\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX room_types_prices_monthly_idx ON room_types ((CAST(JSON_UNQUOTE(JSON_EXTRACT(prices, '$.\"monthly\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX room_types_deposits_daily_idx ON room_types ((CAST(JSON_UNQUOTE(JSON_EXTRACT(deposits, '$.\"daily\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX room_types_deposits_weekly_idx ON room_types ((CAST(JSON_UNQUOTE(JSON_EXTRACT(deposits, '$.\"weekly\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX room_types_deposits_monthly_idx ON room_types ((CAST(JSON_UNQUOTE(JSON_EXTRACT(deposits, '$.\"monthly\"')) AS UNSIGNED)))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS room_types_prices_daily_idx');
            DB::statement('DROP INDEX IF EXISTS room_types_prices_weekly_idx');
            DB::statement('DROP INDEX IF EXISTS room_types_prices_monthly_idx');
            DB::statement('DROP INDEX IF EXISTS room_types_deposits_daily_idx');
            DB::statement('DROP INDEX IF EXISTS room_types_deposits_weekly_idx');
            DB::statement('DROP INDEX IF EXISTS room_types_deposits_monthly_idx');
        } elseif ($driver === 'mysql') {
            DB::statement('DROP INDEX room_types_prices_daily_idx ON room_types');
            DB::statement('DROP INDEX room_types_prices_weekly_idx ON room_types');
            DB::statement('DROP INDEX room_types_prices_monthly_idx ON room_types');
            DB::statement('DROP INDEX room_types_deposits_daily_idx ON room_types');
            DB::statement('DROP INDEX room_types_deposits_weekly_idx ON room_types');
            DB::statement('DROP INDEX room_types_deposits_monthly_idx ON room_types');
        }
        Schema::dropIfExists('room_types');
    }
};
