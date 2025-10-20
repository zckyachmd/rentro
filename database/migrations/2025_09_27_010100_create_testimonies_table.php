<?php

use App\Enum\TestimonyStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration {
    public function up(): void
    {
        Schema::create('testimonies', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('content_original');
            $table->text('content_curated')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->string('occupation', 120)->nullable();
            $table->string('status', 20)->default(TestimonyStatus::PENDING->value)->index();
            $table->foreignId('curated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('curated_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonies');
    }
};
