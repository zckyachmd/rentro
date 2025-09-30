<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveSectionRequest;
use App\Models\PageContent;
use App\Services\ContentStore;
use App\Traits\DataTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PageContentController extends Controller
{
    use DataTable;

    /**
     * List all existing (page, section, key) combos; filter by page.
     */
    public function index(Request $request): InertiaResponse
    {
        // filters
        $filterPage = (string) $request->query('fpage', '');

        // Distinct (page, section) as Eloquent Builder for DataTable
        $base = PageContent::query()
            ->select(['page', 'section'])
            ->when($filterPage !== '', fn ($q) => $q->where('page', $filterPage))
            ->distinct();

        $options = [
            'search_param' => 'search',
            'searchable'   => ['page', 'section'],
            'sortable'     => [
                'page'    => 'page',
                'section' => 'section',
            ],
            'default_sort' => ['page', 'asc'],
        ];

        $page = $this->applyTable($base, $request, $options);

        $pairs = collect($page->items());

        // Merge with known default sections per page so multiple sections can be managed even before data exists
        $known = [
            'home'    => ['hero', 'features'],
            'about'   => ['content'],
            'privacy' => ['content'],
        ];
        $extra = collect($known)
            ->map(function ($sections, $p) use ($filterPage) {
                if ($filterPage !== '' && $p !== $filterPage) {
                    return [];
                }

                return array_map(fn ($s) => (object) ['page' => $p, 'section' => $s], (array) $sections);
            })
            ->flatten(1);
        $pairs = $pairs
            ->concat($extra)
            ->unique(fn ($r) => (string) $r->page . '|' . (string) $r->section)
            ->values();

        $pagesInSet    = $pairs->pluck('page')->unique()->values()->all();
        $sectionsInSet = $pairs->pluck('section')->unique()->values()->all();

        $rows = PageContent::query()
            ->whereIn('page', $pagesInSet)
            ->whereIn('section', $sectionsInSet)
            ->get(['page', 'section', 'key']);

        $grouped = $rows->groupBy(function ($r) {
            return $r->page . '|' . $r->section;
        });

        $mapped = $pairs->map(function ($row) use ($grouped) {
            $g    = $grouped->get($row->page . '|' . $row->section, collect());
            $keys = $g->pluck('key')->filter()->unique()->sort()->values()->all();
            if (empty($keys)) {
                $keys = (array) \App\Services\ContentStore::knownKeys((string) $row->page, (string) $row->section);
            }

            return [
                'page'    => (string) $row->page,
                'section' => (string) $row->section,
                'keys'    => $keys,
            ];
        });

        // Replace paginator collection (if paginator exists) or assemble synthetic paginator
        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        return Inertia::render('management/pages/index', [
            'pageSections' => $payload,
            'query'        => [
                'page'    => $payload['current_page'],
                'perPage' => $payload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
                'fpage'   => $filterPage,
            ],
            'options' => [
                'pages' => [
                    ['value' => 'home', 'label' => 'Home'],
                    ['value' => 'about', 'label' => 'About'],
                    ['value' => 'privacy', 'label' => 'Privacy'],
                ],
            ],
        ]);
    }

    public function edit(string $page, string $section, Request $request): InertiaResponse
    {
        $locale = (string) $request->query('locale', 'id');
        $keys   = ContentStore::knownKeys($page, $section);

        // Load values for both locales for UI Tabs convenience
        $values = [
            'id' => $this->loadValues($page, $section, 'id', $keys),
            'en' => $this->loadValues($page, $section, 'en', $keys),
        ];

        return Inertia::render('management/pages/edit', [
            'page'           => $page,
            'section'        => $section,
            'keys'           => $keys,
            'activeLocale'   => $locale,
            'valuesByLocale' => $values,
        ]);
    }

    public function update(SaveSectionRequest $request, string $page, string $section): RedirectResponse
    {
        $locale = (string) $request->input('locale');
        $values = (array) $request->input('values', []);

        ContentStore::setSection($page, $section, $locale, $values);

        // Ensure keys structure mirrored across locales (id & en)
        ContentStore::syncKeysStructureAcrossLocales($page, $section, array_keys($values), ['id', 'en']);

        return redirect()
            ->back()
            ->with('alert', ['success' => __('Content saved successfully.')]);
    }

    /**
     * Helper: load values for a locale keyed by known keys.
     */
    protected function loadValues(string $page, string $section, string $locale, array $keys): array
    {
        // Load including unpublished for the editor
        $rows = PageContent::query()
            ->for($page, $locale, false)
            ->section($section)
            ->get(['key', 'value', 'is_published']);

        $map = [];
        foreach ($rows as $r) {
            $map[(string) $r->key] = $r->value;
        }

        $out = [];
        foreach ($keys as $k) {
            $out[$k] = Arr::get($map, $k, null);
        }

        return $out;
    }
}
