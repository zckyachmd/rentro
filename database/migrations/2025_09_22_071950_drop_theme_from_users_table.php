<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('users', 'theme')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('theme');
            });
        }
    }

    public function down(): void
    {
        // No-op: preferences['theme'] is now the source of truth.
    }
};

