<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Floor\CreateFloorRequest;
use App\Http\Requests\Management\Floor\UpdateFloorRequest;
use App\Models\Building;
use App\Models\Floor;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FloorManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Floor::query()->with('building:id,name');

        $options = [
            'select'       => ['id', 'building_id', 'level', 'name'],
            'search_param' => 'search',
            'searchable'   => ['name'],
            'sortable'     => [
                'level'    => 'level',
                'name'     => 'name',
                'building' => function ($q, string $dir) {
                    $q->join('buildings', 'floors.building_id', '=', 'buildings.id')
                      ->orderBy('buildings.name', $dir === 'desc' ? 'DESC' : 'ASC');
                },
            ],
            'default_sort' => ['level', 'asc'],
            'filters'      => [
                'building' => function ($q, $buildingId) {
                    if ($buildingId) {
                        $q->where('building_id', (int) $buildingId);
                    }
                },
            ],
        ];

        $page   = $this->applyTable($query, $request, $options);
        $mapped = $page->getCollection()->map(function (Floor $f): array {
            return [
                'id'          => $f->id,
                'building_id' => $f->building_id,
                'building'    => $f->building ? ['id' => $f->building->id, 'name' => $f->building->name] : null,
                'level'       => (int) $f->level,
                'name'        => $f->name,
            ];
        });
        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        $buildings = Building::query()->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('management/floors/index', [
            'floors' => $payload,
            'query'  => [
                'page'     => $payload['current_page'],
                'perPage'  => $payload['per_page'],
                'sort'     => $request->query('sort'),
                'dir'      => $request->query('dir'),
                'search'   => $request->query('search'),
                'building' => $request->query('building'),
            ],
            'options' => [
                'buildings' => $buildings,
            ],
            'page' => [
                'title' => __('management/floors.title'),
                'desc'  => __('management/floors.desc'),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateFloorRequest $request): RedirectResponse
    {
        $v              = $request->validated();
        $f              = new Floor();
        $f->building_id = (int) $v['building_id'];
        $f->level       = (int) $v['level'];
        $f->name        = $v['name'] ?? null;
        $f->save();

        return back()->with('success', __('management/floors.created'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateFloorRequest $request, Floor $floor): RedirectResponse
    {
        $v                  = $request->validated();
        $floor->building_id = (int) $v['building_id'];
        $floor->level       = (int) $v['level'];
        $floor->name        = $v['name'] ?? null;
        $floor->save();

        return back()->with('success', __('management/floors.updated'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Floor $floor): RedirectResponse
    {
        $floor->delete();

        return back()->with('success', __('management/floors.deleted'));
    }
}
