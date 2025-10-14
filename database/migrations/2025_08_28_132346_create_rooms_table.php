<?php

use App\Enum\RoomStatus;
use App\Enum\GenderPolicy;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->foreignId('floor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number');
            $table->string('name')->nullable();
            $table->decimal('size_m2', 6, 2)->nullable();
            $table->json('price_overrides')->nullable();
            $table->json('deposit_overrides')->nullable();
            $table->unsignedTinyInteger('max_occupancy')->default(1);
            $table->string('status', 20)->default(RoomStatus::VACANT->value)->index();
            $table->string('gender_policy', 10)->default(GenderPolicy::ANY->value)->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['building_id', 'number']);
            $table->index(['building_id', 'floor_id', 'room_type_id']);
        });

        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("CREATE INDEX IF NOT EXISTS rooms_price_overrides_daily_idx ON rooms (((price_overrides->>'daily')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS rooms_price_overrides_weekly_idx ON rooms (((price_overrides->>'weekly')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS rooms_price_overrides_monthly_idx ON rooms (((price_overrides->>'monthly')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS rooms_deposit_overrides_daily_idx ON rooms (((deposit_overrides->>'daily')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS rooms_deposit_overrides_weekly_idx ON rooms (((deposit_overrides->>'weekly')::bigint))");
            DB::statement("CREATE INDEX IF NOT EXISTS rooms_deposit_overrides_monthly_idx ON rooms (((deposit_overrides->>'monthly')::bigint))");
        } elseif ($driver === 'mysql') {
            DB::statement("CREATE INDEX rooms_price_overrides_daily_idx ON rooms ((CAST(JSON_UNQUOTE(JSON_EXTRACT(price_overrides, '$.\"daily\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX rooms_price_overrides_weekly_idx ON rooms ((CAST(JSON_UNQUOTE(JSON_EXTRACT(price_overrides, '$.\"weekly\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX rooms_price_overrides_monthly_idx ON rooms ((CAST(JSON_UNQUOTE(JSON_EXTRACT(price_overrides, '$.\"monthly\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX rooms_deposit_overrides_daily_idx ON rooms ((CAST(JSON_UNQUOTE(JSON_EXTRACT(deposit_overrides, '$.\"daily\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX rooms_deposit_overrides_weekly_idx ON rooms ((CAST(JSON_UNQUOTE(JSON_EXTRACT(deposit_overrides, '$.\"weekly\"')) AS UNSIGNED)))");
            DB::statement("CREATE INDEX rooms_deposit_overrides_monthly_idx ON rooms ((CAST(JSON_UNQUOTE(JSON_EXTRACT(deposit_overrides, '$.\"monthly\"')) AS UNSIGNED)))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS rooms_price_overrides_daily_idx');
            DB::statement('DROP INDEX IF EXISTS rooms_price_overrides_weekly_idx');
            DB::statement('DROP INDEX IF EXISTS rooms_price_overrides_monthly_idx');
            DB::statement('DROP INDEX IF EXISTS rooms_deposit_overrides_daily_idx');
            DB::statement('DROP INDEX IF EXISTS rooms_deposit_overrides_weekly_idx');
            DB::statement('DROP INDEX IF EXISTS rooms_deposit_overrides_monthly_idx');
        } elseif ($driver === 'mysql') {
            DB::statement('DROP INDEX rooms_price_overrides_daily_idx ON rooms');
            DB::statement('DROP INDEX rooms_price_overrides_weekly_idx ON rooms');
            DB::statement('DROP INDEX rooms_price_overrides_monthly_idx ON rooms');
            DB::statement('DROP INDEX rooms_deposit_overrides_daily_idx ON rooms');
            DB::statement('DROP INDEX rooms_deposit_overrides_weekly_idx ON rooms');
            DB::statement('DROP INDEX rooms_deposit_overrides_monthly_idx ON rooms');
        }
        Schema::dropIfExists('rooms');
    }
};
