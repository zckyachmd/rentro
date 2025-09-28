<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\PageLocale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageManagementViewController extends Controller
{
    public function index(Request $request)
    {
        $query = [
            'page'    => (int) $request->integer('page', 1),
            'perPage' => (int) $request->integer('per_page', 20),
            'search'  => (string) $request->string('search'),
            'sort'    => $request->string('sort')->toString() ?: 'updated_at',
            'dir'     => $request->string('dir')->toString() ?: 'desc',
            'status'  => $request->string('status')->toString() ?: null,
            'locale'  => $request->string('locale')->toString() ?: null,
        ];

        $q = Page::query()->with(['locales' => function ($r) {
            $r->select(['id', 'page_id', 'locale', 'status', 'version', 'updated_at']);
        }]);

        if (!empty($query['search'])) {
            $term = '%' . str_replace(' ', '%', $query['search']) . '%';
            $q->where('slug', 'like', $term);
        }

        if (!empty($query['status']) || !empty($query['locale'])) {
            $q->whereHas('locales', function ($r) use ($query) {
                if (!empty($query['status'])) {
                    $r->where('status', $query['status']);
                }
                if (!empty($query['locale'])) {
                    $r->where('locale', strtolower($query['locale']));
                }
            });
        }

        $sort = in_array($query['sort'], ['slug', 'updated_at', 'created_at'], true) ? $query['sort'] : 'updated_at';
        $dir  = $query['dir'] === 'asc' ? 'asc' : 'desc';
        $q->orderBy($sort, $dir);

        $pages = $q->paginate($query['perPage'])->appends($request->query());

        return Inertia::render('management/pages/index', [
            'pages' => $pages,
            'query' => $query,
        ]);
    }

    public function edit(Page $page)
    {
        // Load per-locale draft data to avoid client-side fetch
        $locales = PageLocale::query()
            ->where('page_id', $page->id)
            ->get(['locale', 'title', 'description', 'fields_draft', 'seo_draft'])
            ->keyBy('locale')
            ->map(function (PageLocale $loc) {
                return [
                    'title'       => $loc->title,
                    'description' => $loc->description,
                    'fields'      => (array) ($loc->fields_draft ?? []),
                    'seo'         => (array) ($loc->seo_draft ?? []),
                ];
            });

        return Inertia::render('management/pages/edit', [
            'pageId'           => $page->id,
            'slug'             => $page->slug,
            'availableLocales' => ['id', 'en'],
            'locales'          => (object) $locales,
        ]);
    }
}
