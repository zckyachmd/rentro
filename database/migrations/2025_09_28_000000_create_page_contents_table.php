<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('page_contents', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('page');
            $table->string('section');
            $table->string('key');
            $table->string('locale', 5);
            $table->text('value')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->unique(['page', 'section', 'key', 'locale'], 'uq_page_section_key_locale');
            $table->index(['page', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_contents');
    }
};

