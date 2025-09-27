<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promotions', function (Blueprint $table): void {
            $table->json('tnc')->nullable()->after('tags');
            $table->json('how')->nullable()->after('tnc');
            $table->boolean('is_listed')->default(true)->after('is_active')->index();
        });
    }

    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table): void {
            $table->dropColumn(['tnc', 'how', 'is_listed']);
        });
    }
};

