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

            $table->enum('type', ['KTP', 'SIM', 'PASSPORT', 'NPWP', 'other'])->nullable();
            $table->string('number')->nullable();
            $table->string('file_path');

            $table->date('issued_at')->nullable();
            $table->date('expires_at')->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'type']);
            $table->index(['status', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_documents');
    }
};
