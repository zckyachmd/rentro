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
        Schema::create('wifi_whitelists', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['domain','mac','ip']);
            $table->string('value', 255);
            $table->string('notes', 200)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['type','value']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wifi_whitelists');
    }
};
