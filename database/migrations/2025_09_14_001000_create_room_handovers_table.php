<?php

use App\Enum\RoomHandoverStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_handovers', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20)->index(); // checkin | checkout
            $table->string('status', 20)->default(RoomHandoverStatus::PENDING->value)->index();
            $table->text('notes')->nullable();
            $table->json('meta')->nullable();
            $table->json('attachments')->nullable();
            $table->timestamps();

            $table->index(['contract_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_handovers');
    }
};
