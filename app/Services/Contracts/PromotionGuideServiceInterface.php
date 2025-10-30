<?php

namespace App\Services\Contracts;

use App\Models\Promotion;

interface PromotionGuideServiceInterface
{
    /**
     * Build Cara Penggunaan steps based on promotion scopes, rules, and channel/coupon.
     * @return array<int,string>
     */
    public function buildHowTemplate(Promotion $p): array;

    /**
     * Basic fallback T&C.
     * @return array<int,string>
     */
    public function buildTncTemplate(Promotion $p): array;
}
