<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('user_addresses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('label')->nullable(); // Rumah/Kantor/dll
            $table->string('address_line');
            $table->string('village')->nullable();   // Kelurahan
            $table->string('district')->nullable();  // Kecamatan
            $table->string('city');                  // Kota/Kabupaten
            $table->string('province');
            $table->string('postal_code', 20)->nullable();

            $table->timestamps();

            $table->index(['city', 'province']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_addresses');
    }
};
