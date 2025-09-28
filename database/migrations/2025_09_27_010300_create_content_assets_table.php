<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('content_assets', function (Blueprint $table): void {
            $table->id();
            $table->nullableMorphs('owner');
            $table->string('disk')->default('public');
            $table->string('path');
            $table->string('collection')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_assets');
    }
};

