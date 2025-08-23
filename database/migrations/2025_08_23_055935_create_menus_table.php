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
        Schema::create('menus', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('menu_group_id')
                ->constrained('menu_groups')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('menus')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('label', 100);
            $table->string('href')->nullable();       // fallback URL absolute/relative
            $table->string('icon')->nullable();       // simpan nama icon lucide, mis. 'Home', 'Wrench'
            $table->string('permission_name')->nullable(); // mis. 'view dashboard'
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['menu_group_id', 'sort_order']);
            $table->index(['parent_id', 'sort_order']);
            $table->index('permission_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
