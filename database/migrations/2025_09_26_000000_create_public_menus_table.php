<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $driver = DB::getDriverName();

        Schema::create('public_menus', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('public_menus')->nullOnDelete();
            $table->string('placement', 20)->default('header');
            $table->string('label');
            $table->json('label_i18n')->nullable();
            $table->string('href')->nullable();
            $table->string('icon')->nullable();
            $table->string('target')->nullable();
            $table->string('rel')->nullable();
            $table->integer('sort')->default(0);
            $table->boolean('is_active')->default(true);

            if ($driver !== 'pgsql') {
                $table->integer('parent_key')->storedAs('COALESCE(parent_id, 0)');
                $table->unique(['label', 'parent_key'], 'public_menus_label_parent_unique');
            }

            $table->timestamps();

            $table->index('placement');
        });

        if ($driver === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX public_menus_label_parent_expr_unique ON public_menus (label, COALESCE(parent_id, 0))');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS public_menus_label_parent_expr_unique');
        }

        Schema::dropIfExists('public_menus');
    }
};
