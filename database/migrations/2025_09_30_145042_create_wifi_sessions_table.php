<?php

use App\Enum\WifiSessionStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wifi_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gateway_id')->constrained('wifi_gateways')->cascadeOnDelete();
            $table->foreignId('policy_id')->nullable()->constrained('wifi_policies')->nullOnDelete();
            $table->string('mac', 17)->index();
            $table->string('ip', 45)->nullable();
            $table->string('token', 64)->unique();
            $table->string('status', 20)->default(WifiSessionStatus::PENDING->value);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->unsignedBigInteger('bytes_in')->default(0);
            $table->unsignedBigInteger('bytes_out')->default(0);
            $table->unsignedInteger('uptime')->default(0);
            $table->string('ended_reason', 100)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['gateway_id', 'status']);
            $table->index(['mac', 'gateway_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wifi_sessions');
    }
};
