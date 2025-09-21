<?php

use App\Enum\InvoiceStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('number', 50)->unique();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamp('due_date');
            $table->unsignedBigInteger('amount_cents');
            $table->unsignedBigInteger('outstanding_cents')->default(0);
            $table->json('items')->nullable();
            $table->string('status', 20)->default(InvoiceStatus::PENDING->value)->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['contract_id', 'due_date']);
            $table->index(['contract_id', 'status']);
            $table->index(['contract_id', 'period_start', 'period_end']);
            $table->index(['due_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
