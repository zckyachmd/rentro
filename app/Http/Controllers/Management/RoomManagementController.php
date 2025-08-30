<?php

namespace App\Http\Controllers\Management;

use App\Enum\RoomStatus;
use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Room;
use App\Models\RoomType;
use App\Traits\DataTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomManagementController extends Controller
{
    use DataTable;

    public function index(Request $request)
    {
        // Base query: select minimal columns + relations & counts
        $query = Room::query()
            ->select([
                'id',
                'number',
                'name',
                'status',
                'max_occupancy',
                'price_cents',
                'price_currency',
                'building_id',
                'floor_id',
                'room_type_id',
            ])
            ->with([
                'building:id,name',
                'floor:id,building_id,level',
                'type:id,name',
            ])
            ->withCount('amenities');

        // Options for DataTable helper
        $options = [
            'search_param' => 'q',
            'searchable'   => ['number', 'name'],
            'sortable'     => [
                'number'        => 'number',
                'floor_id'      => 'floor_id',
                'status'        => 'status',
                'max_occupancy' => 'max_occupancy',
                'price'         => 'price_cents',
                'amenities'     => fn ($q, string $dir) => $q->orderBy('amenities_count', $dir),
            ],
            'default_sort' => ['number', 'asc'],
            'filters'      => [
                'building_id'   => fn ($q, $v) => $q->where('building_id', $v),
                'floor_id'      => fn ($q, $v) => $q->where('floor_id', $v),
                'type_id'       => fn ($q, $v) => $q->where('room_type_id', $v),
                'status'        => fn ($q, $v) => $q->where('status', $v),
                'gender_policy' => fn ($q, $v) => $q->where('gender_policy', $v),
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\App\Models\Room> $page */
        $page = $this->applyTable($query, $request, $options);

        // Map collection to FE-friendly shape
        $mapped = $page->getCollection()->map(function (Room $r): array {
            return [
                'id'            => $r->id,
                'number'        => $r->number,
                'name'          => $r->name,
                'status'        => $r->status instanceof RoomStatus ? $r->status->value : $r->status,
                'max_occupancy' => (int) $r->max_occupancy,
                'price_rupiah'  => method_exists($r, 'getPriceRupiahAttribute') ? $r->price_rupiah : null,
                'building'      => $r->relationLoaded('building') && $r->building ? [
                    'id'   => $r->building->id,
                    'name' => $r->building->name,
                ] : null,
                'floor' => $r->relationLoaded('floor') && $r->floor ? [
                    'id'          => $r->floor->id,
                    'level'       => $r->floor->level,
                    'building_id' => $r->floor->building_id,
                ] : null,
                'type' => $r->relationLoaded('type') && $r->type ? [
                    'id'   => $r->type->id,
                    'name' => $r->type->name,
                ] : null,
                'amenities_count' => (int) ($r->amenities_count ?? 0),
            ];
        });

        $page->setCollection($mapped);
        $roomsPayload = $this->tablePaginate($page);

        // Options for filters (dropdowns)
        $optionsPayload = [
            'buildings' => Building::query()->select('id', 'name')->orderBy('name')->get(),
            'floors'    => Floor::query()->select('id', 'level', 'building_id')->orderBy('building_id')->orderBy('level')->get(),
            'types'     => RoomType::query()->select('id', 'name')->orderBy('name')->get(),
            'statuses'  => collect(RoomStatus::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => match ($c->value) {
                    'vacant'      => 'Kosong',
                    'reserved'    => 'Dipesan',
                    'occupied'    => 'Terisi',
                    'maintenance' => 'Perbaikan',
                    'inactive'    => 'Nonaktif',
                    default       => ucfirst($c->value),
                },
            ])->values(),
        ];

        return Inertia::render('management/room/index', [
            'rooms'   => $roomsPayload,
            'options' => $optionsPayload,
            'query'   => [
                'page'          => $roomsPayload['current_page'],
                'per_page'      => $roomsPayload['per_page'],
                'sort'          => $request->query('sort'),
                'dir'           => $request->query('dir'),
                'q'             => $request->query('q'),
                'building_id'   => $request->query('building_id'),
                'floor_id'      => $request->query('floor_id'),
                'type_id'       => $request->query('type_id'),
                'status'        => $request->query('status'),
                'gender_policy' => $request->query('gender_policy'),
            ],
        ]);
    }
}
