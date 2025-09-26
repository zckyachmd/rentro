<?php

namespace App\Services\Contracts;

use App\Enum\BillingPeriod;
use App\Models\Invoice;
use App\Models\Promotion;
use App\Models\Room;
use App\Models\User;

interface PromotionServiceInterface
{
    /**
     * Find applicable promotions and compute discounts for a room context.
     *
     * @param Room $room
     * @param BillingPeriod|string $period
     * @param array $context Optional context: ['user' => User|null,'invoice' => Invoice|null,'contract_id' => int|null,'channel' => string|null,'coupon_code' => string|null,'now' => \DateTimeInterface|null,'current_period_index' => int|null,'per_day_rate_idr' => int|null]
     * @return array{
     *   base_rent:int|null,
     *   base_deposit:int|null,
     *   final_rent:int|null,
     *   final_deposit:int|null,
     *   applied:array<int,array{
     *     promotion:Promotion,
     *     discount_rent:int,
     *     discount_deposit:int,
     *     actions:array,
     *     coupon_id?:int|null,
     *   }>
     * }
     */
    public function evaluateForRoom(Room $room, BillingPeriod|string $period, array $context = []): array;
}
