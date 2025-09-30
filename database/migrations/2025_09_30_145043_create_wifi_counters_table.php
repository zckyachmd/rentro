<?php

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
        Schema::create('wifi_counters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('wifi_sessions')->cascadeOnDelete();
            $table->timestamp('ts');
            $table->unsignedBigInteger('incoming');
            $table->unsignedBigInteger('outgoing');
            $table->unsignedInteger('uptime')->nullable();
            $table->json('raw')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'ts']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wifi_counters');
    }
};
