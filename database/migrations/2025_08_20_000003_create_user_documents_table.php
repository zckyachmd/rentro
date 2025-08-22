<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('user_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('type', 50)->nullable();
            $table->string('number', 50)->nullable();
            $table->string('file_path', 255);

            $table->date('issued_at')->nullable();
            $table->date('expires_at')->nullable();

            $table->string('status', 50)->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['user_id']);
            $table->index(['status', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_documents');
    }
};
