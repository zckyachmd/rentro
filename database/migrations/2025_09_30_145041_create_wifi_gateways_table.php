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
        Schema::create('wifi_gateways', function (Blueprint $table) {
            $table->id();
            $table->string('gw_id', 100)->unique();
            $table->string('mac_address', 17)->nullable()->after('gw_id')->index();
            $table->string('name', 100)->nullable();
            $table->string('mgmt_ip', 45)->nullable()->index();
            $table->unsignedBigInteger('sys_uptime')->nullable();
            $table->decimal('sys_load', 5, 2)->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('last_ping_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wifi_gateways');
    }
};
