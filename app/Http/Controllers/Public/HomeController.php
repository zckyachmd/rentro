<?php

namespace App\Http\Controllers\Public;

use App\Enum\RoomStatus;
use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Testimony;
use App\Models\User;
use App\Services\ContentStore;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $rawRooms = Room::query()
            ->with([
                'amenities:id,name,category',
                'type' => function ($q) {
                    $q->withTrashed()->select('id', 'name', 'prices', 'deposits');
                },
                'building:id,name',
                'floor:id,name',
            ])
            ->whereIn('status', [RoomStatus::VACANT->value])
            ->limit(60)
            ->get();

        $rows = $rawRooms->map(function (Room $r) {
            $base = (int) ($r->effectivePriceCents('monthly') ?? 0);

            /** @var \App\Services\Contracts\PromotionServiceInterface $promoService */
            $promoService = app(\App\Services\Contracts\PromotionServiceInterface::class);
            $eval         = $promoService->evaluateForRoom($r, 'monthly');
            $final        = (int) ($eval['final_rent'] ?? $base);

            $fmt = function (?int $amount) {
                if ($amount === null || $amount <= 0) {
                    return null;
                }

                return 'Rp ' . number_format($amount, 0, ',', '.') . ' / bulan';
            };

            $originalStr = $base > 0 ? $fmt($base) : null;
            $promoStr    = $final > 0 && $final !== $base ? $fmt($final) : null;

            $amenities = $r->amenities
                ->sortBy(function ($a) {
                    /* @var \App\Models\Amenity $a */
                    return ($a->category === 'room') ? 0 : 1;
                })
                ->pluck('name')
                ->filter()
                ->values();

            $totalAmen = $amenities->count();
            $amenList  = $totalAmen > 4 ? $amenities->take(3)->all() : $amenities->take(4)->all();
            $amenMore  = $totalAmen > 4 ? max(0, $totalAmen - 3) : 0;

            $rawName       = is_string($r->name) ? trim($r->name) : '';
            $hasCustomName = $rawName !== '';
            $name          = $hasCustomName ? $rawName : ('Kamar ' . ($r->number ?? ''));

            return [
                '_sort_price'     => max($final, $base),
                'name'            => $name,
                'slug'            => Str::slug($name) ?: ('room-' . (string) $r->id),
                'type'            => $r->type?->name,
                'number'          => $r->number,
                'building'        => $r->building?->name,
                'has_custom_name' => $hasCustomName,
                'price'           => $promoStr ?? ($originalStr ?? '-'),
                'amenities'       => $amenList,
                'amenities_more'  => $amenMore,
                'originalPrice'   => $originalStr,
                'promoPrice'      => $promoStr,
            ];
        });

        $rooms = $rows->sortByDesc('_sort_price')
            ->take(12)
            ->map(fn ($x) => collect($x)->except(['_sort_price'])->all())
            ->values();

        $testimonies = Testimony::query()
            ->with(['user:id,name,avatar_path'])
            ->where('status', \App\Enum\TestimonyStatus::PUBLISHED->value)
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(15)
            ->get()
            ->map(function (Testimony $t): array {
                $content    = (string) ($t->content_curated ?: $t->content_original ?: '');
                $isAnon     = (bool) ($t->is_anonymous ?? false);
                $occupation = $t->occupation ?: null;
                $year       = optional($t->published_at ?: $t->created_at)->format('Y');

                /** @var User|null $u */
                $u         = $t->user;
                $name      = $u ? ($u->name ?: 'Anonim') : 'Anonim';
                $avatarUrl = ($u && $u->avatar_path) ? Storage::url($u->avatar_path) : null;

                return [
                    'name'         => (string) $name,
                    'avatar_url'   => $avatarUrl,
                    'content'      => $content,
                    'is_anonymous' => $isAnon,
                    'occupation'   => $occupation,
                    'year'         => $year,
                ];
            })
            ->values();

        $locale = app()->getLocale();
        $hero   = ContentStore::getSection('home', 'hero', $locale);

        return Inertia::render('public/home/index', [
            'rooms'       => $rooms,
            'testimonies' => $testimonies,
            'sections'    => [
                'hero' => $hero,
            ],
            'seo' => [
                'title' => $hero['title'] ?? 'Home',
                'desc'  => $hero['subtitle'] ?? null,
            ],
        ]);
    }

    public function catalog()
    {
        return Inertia::render('public/catalog');
    }

    public function blogIndex()
    {
        return Inertia::render('public/blog/index');
    }

    public function blogShow(string $slug)
    {
        return Inertia::render('public/blog/show', [
            'slug' => $slug,
        ]);
    }

    public function help()
    {
        return Inertia::render('public/help');
    }

    public function about()
    {
        return Inertia::render('public/about');
    }

    public function privacy()
    {
        return Inertia::render('public/privacy');
    }

    public function terms()
    {
        return Inertia::render('public/terms');
    }

    public function contact()
    {
        return Inertia::render('public/contact');
    }
}
