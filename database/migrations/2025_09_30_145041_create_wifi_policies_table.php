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
        Schema::create('wifi_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->unsignedSmallInteger('max_devices')->default(1);
            $table->unsignedBigInteger('quota_bytes')->nullable();
            if (DB::getDriverName() === 'pgsql') {
                $table->jsonb('quota')->nullable();
            } else {
                $table->json('quota')->nullable();
            }
            $table->unsignedInteger('max_uptime_s')->nullable();
            if (DB::getDriverName() === 'pgsql') {
                $table->jsonb('schedule_json')->nullable();
            } else {
                $table->json('schedule_json')->nullable();
            }
            $table->boolean('is_active')->default(true);
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE INDEX IF NOT EXISTS wifi_policies_quota_gin ON wifi_policies USING GIN (quota);');
            DB::statement('CREATE INDEX IF NOT EXISTS wifi_policies_schedule_gin ON wifi_policies USING GIN (schedule_json);');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes if PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS wifi_policies_quota_gin;');
            DB::statement('DROP INDEX IF EXISTS wifi_policies_schedule_gin;');
        }
        Schema::dropIfExists('wifi_policies');
    }
};
