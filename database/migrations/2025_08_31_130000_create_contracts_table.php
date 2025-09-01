<?php

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // tenant
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->unsignedBigInteger('rent_cents');
            $table->unsignedBigInteger('deposit_cents')->default(0);
            $table->string('billing_period', 10)->default(BillingPeriod::MONTHLY->value);
            $table->unsignedTinyInteger('billing_day')->default(1); // 1-31
            $table->string('status', 20)->default(ContractStatus::ACTIVE->value)->index();
            $table->boolean('auto_renew')->default(true)->index();
            $table->timestamp('renewal_cancelled_at')->nullable();
            $table->timestamp('paid_in_full_at')->nullable();
            $table->unsignedBigInteger('deposit_refund_cents')->nullable();
            $table->timestamp('deposit_refunded_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'room_id']);
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
