<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\PageLocale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class PageController extends Controller
{
    public function show(Request $request, string $slug)
    {
        $locale = strtolower(explode('-', app()->getLocale())[0]);
        // Simplified: render draft content directly (no publish/preview states)
        $cacheKey = sprintf('page:%s:%s:%s', $slug, $locale, 'draft');

        $payload = Cache::remember($cacheKey, now()->addMinutes(20), function () use ($slug, $locale) {
            $page = Page::query()->where('slug', $slug)->first();
            if (!$page) {
                abort(404);
            }

            $loc = PageLocale::query()
                ->where('page_id', $page->id)
                ->where('locale', $locale)
                ->first();

            if (!$loc) {
                abort(404);
            }

            // Use published if available, else fallback to draft
            $seo = $loc->seo_published ?? $loc->seo_draft ?? [];

            return [
                'slug' => $slug,
                'meta' => [
                    'title'       => $seo['title'] ?? ($loc->title ?: ucfirst($slug)),
                    'description' => $seo['description'] ?? $loc->description,
                    'seo'         => $seo,
                    'url'         => URL::current(),
                    'alternates'  => [], // dapat diisi jika multi locale dipakai aktif
                ],
                'fields' => (array) ($loc->fields_published ?? $loc->fields_draft ?? []),
                'blocks' => (array) ($loc->blocks_published ?? $loc->blocks_draft ?? []),
            ];
        });

        $component = $slug === 'home' ? 'public/home' : 'pages/generic';

        return Inertia::render($component, $payload);
    }
}
