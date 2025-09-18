<?php

use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('method', 30)->default(PaymentMethod::CASH->value)->index();
            $table->string('status', 20)->default(PaymentStatus::PENDING->value)->index();
            $table->unsignedBigInteger('amount_cents');
            $table->unsignedBigInteger('pre_outstanding_cents')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('reference', 100)->nullable();
            $table->string('provider', 50)->nullable();
            $table->string('va_number', 50)->nullable();
            $table->timestamp('va_expired_at')->nullable();
            $table->json('meta')->nullable();
            $table->json('attachments')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['reference']);
            $table->index(['invoice_id', 'status']);
            $table->index(['provider', 'status']);
            $table->index(['va_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
