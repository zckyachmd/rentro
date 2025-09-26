<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Amenity\CreateAmenityRequest;
use App\Http\Requests\Management\Amenity\UpdateAmenityRequest;
use App\Models\Amenity;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AmenityManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Amenity::query();

        $options = [
            'select'       => ['id', 'name', 'name_i18n', 'icon', 'category'],
            'search_param' => 'search',
            'searchable'   => ['name', 'category'],
            'sortable'     => [
                'name'     => 'name',
                'category' => 'category',
            ],
            'default_sort' => ['name', 'asc'],
            'filters'      => [
                'category' => function ($q, $category) {
                    $allowed = array_map(fn (\App\Enum\AmenityCategory $c) => $c->value, \App\Enum\AmenityCategory::cases());
                    if (in_array($category, $allowed, true)) {
                        $q->where('category', $category);
                    }
                },
            ],
        ];

        $page = $this->applyTable($query, $request, $options);

        $collection = $page->getCollection();

        $mapped = $collection->map(function (Amenity $a): array {
            $names = (array) ($a->getRawOriginal('name_i18n') ? json_decode((string) $a->getRawOriginal('name_i18n'), true) : []);

            return [
                'id'       => $a->id,
                'name'     => $a->name, // resolved by accessor
                'icon'     => $a->icon,
                'category' => $a->category,
                'names'    => $names,
            ];
        });

        $page->setCollection($mapped);

        $payload = $this->tablePaginate($page);

        return Inertia::render('management/amenities/index', [
            'amenities' => $payload,
            'query'     => [
                'page'     => $payload['current_page'],
                'perPage'  => $payload['per_page'],
                'sort'     => $request->query('sort'),
                'dir'      => $request->query('dir'),
                'search'   => $request->query('search'),
                'category' => $request->query('category'),
            ],
            'page' => [
                'title' => __('management/amenities.title'),
                'desc'  => __('management/amenities.desc'),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateAmenityRequest $request): RedirectResponse
    {
        $validated          = $request->validated();
        $amenity            = new Amenity();
        $amenity->icon      = $validated['icon'] ?? null;
        $amenity->category  = $validated['category'] ?? null;
        $amenity->name_i18n = (array) ($validated['names'] ?? []);
        if (!empty($validated['name'])) {
            $amenity->name = $validated['name'];
        }
        $amenity->save();

        $this->logEvent(
            event: 'amenity_created',
            causer: $request->user(),
            subject: $amenity,
            properties: [
                'name'     => (string) $amenity->name,
                'icon'     => (string) ($amenity->icon ?? ''),
                'category' => (string) ($amenity->category ?? ''),
            ],
        );

        return back()->with('success', __('management/amenities.created'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAmenityRequest $request, Amenity $amenity): RedirectResponse
    {
        $validated          = $request->validated();
        $before             = $amenity->only(['name', 'icon', 'category']);
        $amenity->icon      = $validated['icon'] ?? null;
        $amenity->category  = $validated['category'] ?? null;
        $amenity->name_i18n = (array) ($validated['names'] ?? []);
        if (!empty($validated['name'])) {
            $amenity->name = $validated['name'];
        }
        $amenity->save();

        $after = $amenity->only(['name', 'icon', 'category']);
        if ($before !== $after) {
            $this->logEvent(
                event: 'amenity_updated',
                causer: $request->user(),
                subject: $amenity,
                properties: [
                    'before' => $before,
                    'after'  => $after,
                ],
            );
        }

        return back()->with('success', __('management/amenities.updated'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Amenity $amenity): RedirectResponse
    {
        $snapshot = $amenity->only(['id', 'name', 'icon', 'category']);
        $amenity->delete();

        $this->logEvent(
            event: 'amenity_deleted',
            causer: request()->user(),
            subject: $amenity,
            properties: $snapshot,
        );

        return back()->with('success', __('management/amenities.deleted'));
    }
}
