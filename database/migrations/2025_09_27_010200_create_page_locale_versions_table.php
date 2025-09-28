<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('page_locale_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_locale_id')->constrained('page_locales')->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->json('snapshot');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->index(['page_locale_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_locale_versions');
    }
};

