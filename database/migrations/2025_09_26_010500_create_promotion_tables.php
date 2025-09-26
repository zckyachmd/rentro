<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // promotions — header promo
        Schema::create('promotions', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            // Validity window
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            // Stacking behavior
            $table->string('stack_mode', 20)->default('stack')->index(); // stack|highest_only|exclusive
            $table->unsignedInteger('priority')->default(100)->index(); // smaller = applied earlier
            // Usage limits
            $table->unsignedInteger('total_quota')->nullable();
            $table->unsignedInteger('per_user_limit')->nullable();
            $table->unsignedInteger('per_contract_limit')->nullable();
            $table->unsignedInteger('per_invoice_limit')->nullable();
            $table->unsignedInteger('per_day_limit')->nullable();
            $table->unsignedInteger('per_month_limit')->nullable();
            // Channels: if null means any; otherwise constrained in rules or here as a default
            $table->string('default_channel', 20)->nullable()->index(); // public|referral|manual|coupon
            // Coupon requirement (shared or unique codes managed in promotion_coupons)
            $table->boolean('require_coupon')->default(false)->index();
            // Flags
            $table->boolean('is_active')->default(true)->index();
            $table->json('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // promotion_scopes — sasaran promo (global / building / floor / room_type / room)
        Schema::create('promotion_scopes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->string('scope_type', 20)->index(); // global|building|floor|room_type|room
            $table->unsignedBigInteger('building_id')->nullable();
            $table->unsignedBigInteger('floor_id')->nullable();
            $table->unsignedBigInteger('room_type_id')->nullable();
            $table->unsignedBigInteger('room_id')->nullable();
            $table->timestamps();

            $table->index(['promotion_id', 'scope_type']);
            $table->index(['building_id', 'floor_id', 'room_type_id', 'room_id']);
        });

        // promotion_rules — syarat
        Schema::create('promotion_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            // monetary
            $table->unsignedBigInteger('min_spend_idr')->nullable();
            $table->unsignedBigInteger('max_discount_idr')->nullable();
            // applicability
            $table->boolean('applies_to_rent')->default(true);
            $table->boolean('applies_to_deposit')->default(false);
            // limit to billing periods: [daily,weekly,monthly]
            $table->json('billing_periods')->nullable();
            // time-based constraints
            $table->date('date_from')->nullable();
            $table->date('date_until')->nullable();
            $table->json('days_of_week')->nullable(); // [1..7] (Mon..Sun) or strings
            $table->time('time_start')->nullable();
            $table->time('time_end')->nullable();
            // channel constraint for this rule (overrides default if present)
            $table->string('channel', 20)->nullable()->index(); // public|referral|manual|coupon
            // first_n_periods: only for early periods
            $table->unsignedSmallInteger('first_n_periods')->nullable();
            // user / role constraints (simple JSON lists for flexibility)
            $table->json('allowed_role_names')->nullable();
            $table->json('allowed_user_ids')->nullable();
            $table->timestamps();
            $table->index(['promotion_id']);
        });

        // promotion_actions — efek diskon
        Schema::create('promotion_actions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->string('action_type', 40)->index(); // percent|amount|fixed_price|free_n_days|first_n_periods_percent|first_n_periods_amount
            // Target flags
            $table->boolean('applies_to_rent')->default(true);
            $table->boolean('applies_to_deposit')->default(false);
            // Value holders (only some will be used depending on action_type)
            $table->unsignedInteger('percent_bps')->nullable();         // e.g., 2000 = 20%
            $table->unsignedBigInteger('amount_idr')->nullable();       // amount off
            $table->unsignedBigInteger('fixed_price_idr')->nullable();  // final price
            $table->unsignedSmallInteger('n_days')->nullable();         // for free_n_days
            $table->unsignedSmallInteger('n_periods')->nullable();      // for first_n_periods_*
            $table->unsignedBigInteger('max_discount_idr')->nullable(); // cap for this action
            $table->unsignedInteger('priority')->default(100);          // order of actions in a promo
            $table->timestamps();
            $table->index(['promotion_id', 'priority']);
        });

        // promotion_coupons — daftar kode
        Schema::create('promotion_coupons', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->string('code', 64)->index(); // unique or shared codes; uniqueness handled with additional constraints
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('max_redemptions')->nullable();
            $table->unsignedInteger('redeemed_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['promotion_id', 'code']);
        });

        // promotion_redemptions — pemakaian
        Schema::create('promotion_redemptions', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('coupon_id')->nullable()->constrained('promotion_coupons')->nullOnDelete();
            $table->foreignId('contract_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('discount_idr')->default(0);
            $table->json('meta')->nullable(); // snapshot of applied actions or reason
            $table->timestamp('redeemed_at');
            $table->timestamps();

            $table->index(['promotion_id', 'user_id']);
            $table->index(['invoice_id']);
            $table->index(['contract_id']);
            $table->index(['coupon_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_redemptions');
        Schema::dropIfExists('promotion_coupons');
        Schema::dropIfExists('promotion_actions');
        Schema::dropIfExists('promotion_rules');
        Schema::dropIfExists('promotion_scopes');
        Schema::dropIfExists('promotions');
    }
};

