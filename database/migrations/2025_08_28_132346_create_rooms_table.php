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
            $table->id();

            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->foreignId('floor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_type_id')->nullable()->constrained()->nullOnDelete();

            $table->string('number');                 // “201”, “B-12”
            $table->string('name')->nullable();       // opsional: “Kamar 201”
            $table->decimal('size_m2', 6, 2)->nullable();

            // Pricing dasar (bisa ditimpa oleh tabel rate ke depannya)
            $table->unsignedBigInteger('price_cents')->default(0);
            $table->string('price_currency', 3)->default('IDR');
            $table->unsignedBigInteger('deposit_cents')->default(0);
            $table->string('billing_period', 10)->default(BillingPeriod::MONTHLY->value); // enum string

            $table->unsignedTinyInteger('max_occupancy')->default(1);
            $table->boolean('is_shared')->default(false); // kamar sharing?

            $table->string('status', 20)->default(RoomStatus::VACANT->value)->index();
            $table->string('gender_policy', 10)->default(GenderPolicy::ANY->value)->index();

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // unik per gedung: nomor kamar tidak boleh duplikat di 1 gedung
            $table->unique(['building_id', 'number']);

            // indeks untuk pencarian di DataTable
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
