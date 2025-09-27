<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PromotionsController extends Controller
{
    public function index(Request $request)
    {
        $status = (string) $request->query('status', '');
        $tag    = (string) $request->query('tag', '');
        $q      = trim((string) $request->query('q', ''));
        $sort   = (string) $request->query('sort', '');

        $today = now()->startOfDay();

        $query = Promotion::query()
            ->where('is_active', true)
            ->where('is_listed', true)
            ->when($status === 'active', function ($q) use ($today) {
                $q->where(function ($x) use ($today) {
                    $x->whereNull('valid_from')->orWhere('valid_from', '<=', $today);
                })->where(function ($x) use ($today) {
                    $x->whereNull('valid_until')->orWhere('valid_until', '>=', $today);
                });
            })
            ->when($status === 'upcoming', function ($q) use ($today) {
                $q->whereNotNull('valid_from')->where('valid_from', '>', $today);
            })
            ->when($status === 'expired', function ($q) use ($today) {
                $q->whereNotNull('valid_until')->where('valid_until', '<', $today);
            })
            ->when($tag !== '', function ($q) use ($tag) {
                $q->whereJsonContains('tags', $tag);
            })
            ->when($q !== '', function ($qb) use ($q) {
                $kw = '%' . str_replace('%', '\\%', $q) . '%';
                $qb->where(function ($w) use ($kw) {
                    $w->where('name', 'like', $kw)
                        ->orWhere('slug', 'like', $kw)
                        ->orWhere('description', 'like', $kw);
                });
            })
            ->orderByDesc('priority')
            ->orderBy('name');

        $rows = $query->limit(100)->get([
            'id',
            'name',
            'slug',
            'description',
            'valid_from',
            'valid_until',
            'require_coupon',
            'tags',
        ]);

        if ($sort === 'ending') {
            $rows = $rows->sortBy(function (Promotion $p) {
                return $p->valid_until?->startOfDay()->getTimestamp() ?? PHP_INT_MAX;
            })->values();
        } elseif ($sort === 'latest') {
            $rows = $rows->sortByDesc(function (Promotion $p) {
                return $p->valid_from?->startOfDay()->getTimestamp() ?? -1;
            })->values();
        }

        $promotions = $rows->map(function (Promotion $p) use ($today) {
            $couponCodes = [];
            if ($p->require_coupon) {
                $couponCodes = $p->coupons()
                    ->where('is_active', true)
                    ->where(function ($q) use ($today) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>=', $today);
                    })
                    ->orderBy('id')
                    ->limit(3)
                    ->pluck('code')
                    ->values()
                    ->all();
            }

            return [
                'id'             => (string) $p->id,
                'name'           => $p->name,
                'slug'           => $p->slug,
                'description'    => (string) ($p->description ?? ''),
                'valid_from'     => optional($p->valid_from)->toDateString(),
                'valid_until'    => optional($p->valid_until)->toDateString(),
                'require_coupon' => (bool) $p->require_coupon,
                'tags'           => (array) ($p->tags ?? []),
                'coupons'        => $couponCodes,
            ];
        })->values();

        return Inertia::render('public/promos', [
            'filters' => [
                'status' => $status ?: null,
                'tag'    => $tag ?: null,
                'q'      => $q ?: null,
                'sort'   => $sort ?: null,
            ],
            'promotions' => $promotions,
        ]);
    }

    public function show(string $slug)
    {
        $today = now()->startOfDay();
        $p     = Promotion::query()
            ->where('slug', $slug)
            ->firstOrFail();

        $couponCodes = [];
        if ($p->require_coupon) {
            $couponCodes = $p->coupons()
                ->where('is_active', true)
                ->where(function ($q) use ($today) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>=', $today);
                })
                ->orderBy('id')
                ->limit(50)
                ->pluck('code')
                ->values()
                ->all();
        }

        // Build guides from DB or template
        $tnc = (array) ($p->tnc ?? []);
        $how = (array) ($p->how ?? []);
        /** @var \App\Services\PromotionGuideService $guide */
        $guide = app(\App\Services\PromotionGuideService::class);
        if (empty($how)) {
            $how = $guide->buildHowTemplate($p);
        }
        if (empty($tnc)) {
            $tnc = $guide->buildTncTemplate($p);
        }

        $promotion = [
            'id'             => (string) $p->id,
            'name'           => $p->name,
            'slug'           => $p->slug,
            'description'    => (string) ($p->description ?? ''),
            'valid_from'     => optional($p->valid_from)->toDateString(),
            'valid_until'    => optional($p->valid_until)->toDateString(),
            'require_coupon' => (bool) $p->require_coupon,
            'tags'           => (array) ($p->tags ?? []),
            'coupons'        => $couponCodes,
            'tnc'            => $tnc,
            'how'            => $how,
        ];
        // Try to fetch some recommended matching rooms (top-tier) based on promotion scopes
        $rooms = $this->topTierRoomsForPromotion($p);

        return Inertia::render('public/promos/show', [
            'promotion' => $promotion,
            'rooms'     => $rooms,
        ]);
    }

    // Guide builders moved to service

    /**
     * Get up to 6 top-tier rooms matching promotion scopes.
     * Returns simplified payload suitable for listing.
     * @return array<int,array{id:string,name:string,number:string|null,building?:string|null,floor?:string|null,type?:string|null,price?:string|null}>
     */
    protected function topTierRoomsForPromotion(Promotion $p): array
    {
        $scopes = $p->scopes()->get();

        $hasGlobal   = $scopes->where('scope_type', 'global')->isNotEmpty();
        $roomIds     = $scopes->where('scope_type', 'room')->pluck('room_id')->filter()->map(fn ($v) => (int) $v)->values();
        $roomTypeIds = $scopes->where('scope_type', 'room_type')->pluck('room_type_id')->filter()->map(fn ($v) => (int) $v)->values();
        $buildingIds = $scopes->where('scope_type', 'building')->pluck('building_id')->filter()->map(fn ($v) => (int) $v)->values();
        $floorIds    = $scopes->where('scope_type', 'floor')->pluck('floor_id')->filter()->map(fn ($v) => (int) $v)->values();

        $query = \App\Models\Room::query()
            ->with(['type:id,name,prices,deposits', 'building:id,name', 'floor:id,name'])
            ->limit(60);

        if (!$hasGlobal && ($roomIds->isNotEmpty() || $roomTypeIds->isNotEmpty() || $buildingIds->isNotEmpty() || $floorIds->isNotEmpty())) {
            $query->where(function ($w) use ($roomIds, $roomTypeIds, $buildingIds, $floorIds) {
                if ($roomIds->isNotEmpty()) {
                    $w->orWhereIn('id', $roomIds);
                }
                if ($roomTypeIds->isNotEmpty()) {
                    $w->orWhereIn('room_type_id', $roomTypeIds);
                }
                if ($buildingIds->isNotEmpty()) {
                    $w->orWhereIn('building_id', $buildingIds);
                }
                if ($floorIds->isNotEmpty()) {
                    $w->orWhereIn('floor_id', $floorIds);
                }
            });
        }

        $rooms = $query->get();

        $service = app(\App\Services\Contracts\PromotionServiceInterface::class);
        $channel = $p->default_channel?->value;
        $coupon  = null;
        if ($p->require_coupon) {
            $coupon = $p->coupons()->where('is_active', true)->orderBy('id')->value('code');
        }

        // Compute monthly price + promo price and sort by base price desc
        $rows = $rooms->map(function (\App\Models\Room $r) use ($service, $p, $channel, $coupon) {
            $base = (int) ($r->effectivePriceCents('monthly') ?? 0);
            $eval = $service->evaluateForRoom($r, 'monthly', [
                'channel'     => $channel,
                'coupon_code' => $coupon,
            ]);
            $applied = collect($eval['applied'] ?? [])
                ->first(function ($a) use ($p) {
                    return (int) $a['promotion']->id === (int) $p->id;
                });
            $discount = $applied ? (int) ($applied['discount_rent'] ?? 0) : 0;
            $final    = max(0, $base - $discount);
            $percent  = $base > 0 && $discount > 0 ? (int) round(($discount / $base) * 100) : 0;

            return [
                'room'            => $r,
                'base'            => $base,
                'final'           => $final,
                'discountPercent' => $percent,
            ];
        })->sortByDesc('base')->take(12)->map(function ($x) {
            /** @var \App\Models\Room $r */
            $r        = $x['room'];
            $base     = (int) $x['base'];
            $final    = (int) $x['final'];
            $percent  = (int) $x['discountPercent'];
            $baseStr  = $base > 0 ? ('Rp ' . number_format($base, 0, ',', '.')) : null;
            $finalStr = $final > 0 && $final !== $base ? ('Rp ' . number_format($final, 0, ',', '.')) : null;

            return [
                'id'               => (string) $r->id,
                'name'             => (string) ($r->name ?? ('Kamar ' . ($r->number ?? ''))),
                'number'           => $r->number,
                'building'         => $r->building?->name,
                'floor'            => $r->floor?->name,
                'type'             => $r->type?->name,
                'original_price'   => $baseStr,
                'promo_price'      => $finalStr,
                'discount_percent' => $percent,
            ];
        })->values()->all();

        return $rows;
    }
}
