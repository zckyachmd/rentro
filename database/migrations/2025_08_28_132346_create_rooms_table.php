<?php

use App\Enum\RoomStatus;
use App\Enum\GenderPolicy;
use App\Enum\BillingPeriod;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

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
            $table->unsignedBigInteger('price_cents')->nullable();
            $table->string('billing_period', 10)->default(BillingPeriod::MONTHLY->value);
            $table->unsignedTinyInteger('max_occupancy')->default(1);
            $table->string('status', 20)->default(RoomStatus::VACANT->value)->index();
            $table->string('gender_policy', 10)->default(GenderPolicy::ANY->value)->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['building_id', 'number']);
            $table->index(['building_id', 'floor_id', 'room_type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
