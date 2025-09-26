<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Building\CreateBuildingRequest;
use App\Http\Requests\Management\Building\UpdateBuildingRequest;
use App\Models\Building;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BuildingManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Building::query();

        $options = [
            'select'       => ['id', 'name', 'code', 'address', 'is_active'],
            'search_param' => 'search',
            'searchable'   => ['name', 'code', 'address'],
            'sortable'     => [
                'name'      => 'name',
                'code'      => 'code',
                'is_active' => 'is_active',
            ],
            'default_sort' => ['name', 'asc'],
        ];

        $page   = $this->applyTable($query, $request, $options);
        $mapped = $page->getCollection()->map(function (Building $b): array {
            return [
                'id'        => $b->id,
                'name'      => $b->name,
                'code'      => $b->code,
                'address'   => $b->address,
                'is_active' => (bool) $b->is_active,
            ];
        });
        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        return Inertia::render('management/buildings/index', [
            'buildings' => $payload,
            'query'     => [
                'page'    => $payload['current_page'],
                'perPage' => $payload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
            ],
            'page' => [
                'title' => __('management/buildings.title'),
                'desc'  => __('management/buildings.desc'),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateBuildingRequest $request): RedirectResponse
    {
        $v            = $request->validated();
        $b            = new Building();
        $b->name      = $v['name'];
        $b->code      = $v['code'] ?? null;
        $b->address   = $v['address'] ?? null;
        $b->is_active = (bool) ($v['is_active'] ?? true);
        $b->save();

        return back()->with('success', __('management/buildings.created'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBuildingRequest $request, Building $building): RedirectResponse
    {
        $v                   = $request->validated();
        $building->name      = $v['name'];
        $building->code      = $v['code'] ?? null;
        $building->address   = $v['address'] ?? null;
        $building->is_active = (bool) ($v['is_active'] ?? true);
        $building->save();

        return back()->with('success', __('management/buildings.updated'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Building $building): RedirectResponse
    {
        $building->delete();

        return back()->with('success', __('management/buildings.deleted'));
    }
}
