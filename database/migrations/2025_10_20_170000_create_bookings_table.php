<?php

use App\Enum\BillingPeriod;
use App\Enum\BookingStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->string('number', 64)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained()->restrictOnDelete();
            $table->date('start_date');
            $table->unsignedSmallInteger('duration_count')->default(1);
            $table->string('billing_period', 10)->default(BillingPeriod::MONTHLY->value);
            $table->string('promo_code', 64)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default(BookingStatus::REQUESTED->value)->index();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->unsignedBigInteger('contract_id')->nullable()->index();
            $table->json('estimate')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'room_id']);
            $table->index(['start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};

