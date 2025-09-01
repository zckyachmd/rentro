<?php

namespace App\Http\Controllers\Management;

use App\Enum\RoomStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Room\StoreRoomRequest;
use App\Http\Requests\Management\Room\UpdateRoomRequest;
use App\Models\Amenity;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Room;
use App\Models\RoomType;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RoomManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function index(Request $request)
    {
        $query = Room::query()
            ->select([
                'id',
                'number',
                'name',
                'status',
                'max_occupancy',
                'price_cents',
                'building_id',
                'floor_id',
                'room_type_id',
            ])
            ->with([
                'building:id,name',
                'floor:id,building_id,level',
                'type:id,name,price_cents',
            ])
            ->withCount('amenities');

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

        /** @var \Illuminate\Support\Collection<int, Room> $collection */
        $collection = $page->getCollection();
        $mapped     = $collection->map(function (Room $r): array {
            /** @var Building|null $building */
            $building = $r->relationLoaded('building') ? $r->building : null;
            /** @var Floor|null $floor */
            $floor = $r->relationLoaded('floor') ? $r->floor : null;
            /** @var RoomType|null $type */
            $type = $r->relationLoaded('type') ? $r->type : null;

            $effectivePriceCents = $r->price_cents ?? ($type ? $type->price_cents : null);

            return [
                'id'            => (string) $r->id,
                'number'        => $r->number,
                'name'          => $r->name,
                'status'        => $r->status->value,
                'max_occupancy' => (int) $r->max_occupancy,
                'price_rupiah'  => $effectivePriceCents === null
                    ? null
                    : ('Rp ' . number_format((int) round(((int) $effectivePriceCents) / 100), 0, ',', '.')),
                'building' => $building ? [
                    'id'   => $building->id,
                    'name' => $building->name,
                ] : null,
                'floor' => $floor ? [
                    'id'          => $floor->id,
                    'level'       => $floor->level,
                    'building_id' => $floor->building_id,
                ] : null,
                'type' => $type ? [
                    'id'   => (string) $type->id,
                    'name' => $type->name,
                ] : null,
                'amenities_count' => (int) ($r->amenities_count ?? 0),
            ];
        });

        $page->setCollection($mapped);
        $roomsPayload = $this->tablePaginate($page);

        $optionsPayload = [
            'buildings' => Building::query()->select('id', 'name')->orderBy('name')->get(),
            'floors'    => Floor::query()->select('id', 'level', 'building_id')->orderBy('building_id')->orderBy('level')->get(),
            'types'     => RoomType::query()->select('id', 'name')->orderBy('name')->get()->map(fn (RoomType $t) => ['id' => (string) $t->id, 'name' => $t->name]),
            'statuses'  => RoomStatus::options(),
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

    public function create()
    {
        $optionsPayload = [
            'buildings' => Building::query()->select('id', 'name')->orderBy('name')->get(),
            'floors'    => Floor::query()->select('id', 'level', 'building_id')->orderBy('building_id')->orderBy('level')->get(),
            'types'     => RoomType::query()->select('id', 'name', 'price_cents', 'deposit_cents', 'size_m2')->orderBy('name')->get()->map(function (RoomType $t) {
                return [
                    'id'            => (string) $t->id,
                    'name'          => $t->name,
                    'price_cents'   => $t->price_cents,
                    'deposit_cents' => $t->deposit_cents,
                    'size_m2'       => $t->size_m2,
                ];
            }),
            'statuses'  => RoomStatus::options(),
            'amenities' => Amenity::query()->select('id', 'name')->orderBy('name')->get(),
        ];

        return Inertia::render('management/room/create', [
            'options' => $optionsPayload,
        ]);
    }

    public function store(StoreRoomRequest $request)
    {
        $data = $request->validated();

        $priceCents = array_key_exists('price_rupiah', $data) && $data['price_rupiah'] !== null
            ? (int) round(((float) $data['price_rupiah']))
            : null;

        $attrs = [
            'building_id'    => $data['building_id'],
            'floor_id'       => $data['floor_id'],
            'room_type_id'   => $data['room_type_id'] ?? null,
            'number'         => $data['number'],
            'name'           => $data['name'] ?? null,
            'status'         => $data['status'],
            'max_occupancy'  => $data['max_occupancy'] ?? 1,
            'price_cents'    => $priceCents,
            'gender_policy'  => $data['gender_policy'] ?? null,
            'billing_period' => $data['billing_period'] ?? null,
            'notes'          => $data['notes'] ?? null,
        ];

        /** @var Room $room */
        $room = DB::transaction(function () use ($attrs, $data) {
            $room = Room::create($attrs);

            if (!empty($data['amenities']) && is_array($data['amenities'])) {
                $amenityIds = collect($data['amenities'])
                    ->filter(fn ($v) => $v !== null && $v !== '')
                    ->map(fn ($v) => (int) $v)
                    ->all();
                if (!empty($amenityIds)) {
                    $room->amenities()->sync($amenityIds);
                }
            }

            if (request()->hasFile('photos')) {
                $paths = [];
                foreach ((array) request()->file('photos', []) as $file) {
                    if (!$file) {
                        continue;
                    }
                    $paths[] = $file->store("rooms/{$room->id}", 'public');
                }

                $start    = (int) ($room->photos()->max('ordering') ?? -1);
                $hasCover = $room->photos()->where('is_cover', true)->exists();
                foreach ($paths as $i => $p) {
                    /** @var \App\Models\RoomPhoto $photo */
                    $photo = $room->photos()->create([
                        'path'     => $p,
                        'ordering' => $start + $i + 1,
                        'is_cover' => false,
                    ]);
                    if (!$hasCover && $i === 0) {
                        $photo->is_cover = true;
                        $photo->save();
                        $hasCover = true;
                    }
                }
            }

            return $room;
        });

        return redirect()
            ->route('management.rooms.edit', $room)
            ->with('success', 'Kamar berhasil dibuat.');
    }

    public function show(Room $room)
    {
        $room->load([
            'building:id,name',
            'floor:id,building_id,level',
            'type:id,name,price_cents,deposit_cents,size_m2',
            'photos:id,room_id,path,is_cover,ordering',
            'amenities:id,name',
        ]);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = \Illuminate\Support\Facades\Storage::disk('public');

        $payload = [
            'id'            => (string) $room->id,
            'number'        => $room->number,
            'name'          => $room->name,
            'status'        => $room->status->value,
            'max_occupancy' => (int) $room->max_occupancy,
            'price_rupiah'  => (function () use ($room) {
                $cents = $room->price_cents ?? ($room->type ? $room->type->price_cents : null);

                return $cents === null ? null : ('Rp ' . number_format((int) round(((int) $cents) / 100), 0, ',', '.'));
            })(),
            'deposit_rupiah' => (function () use ($room) {
                $cents = $room->type?->deposit_cents;

                return $cents === null ? null : ('Rp ' . number_format((int) round(((int) $cents) / 100), 0, ',', '.'));
            })(),
            'area_sqm'       => $room->size_m2 !== null ? (float) $room->size_m2 : ($room->type?->size_m2 !== null ? (float) $room->type->size_m2 : null),
            'gender_policy'  => $room->gender_policy->value,
            'billing_period' => $room->billing_period->value,
            'notes'          => $room->notes,
            'building'       => $room->relationLoaded('building') && $room->building ? [
                'id'   => $room->building->id,
                'name' => $room->building->name,
            ] : null,
            'floor' => $room->relationLoaded('floor') && $room->floor ? [
                'id'          => $room->floor->id,
                'level'       => $room->floor->level,
                'building_id' => $room->floor->building_id,
            ] : null,
            'type' => $room->relationLoaded('type') && $room->type ? [
                'id'   => (string) $room->type->id,
                'name' => $room->type->name,
            ] : null,
            'photos' => $room->relationLoaded('photos') ? $room->photos->map(function ($p) use ($disk) {
                return [
                    'id'       => (string) $p->id,
                    'url'      => $disk->url($p->path),
                    'is_cover' => (bool) $p->is_cover,
                    'ordering' => (int) ($p->ordering ?? 0),
                ];
            })->sortBy('ordering')->values() : [],
            'amenities' => $room->relationLoaded('amenities') ? $room->amenities->map(function ($a) {
                return [
                    'id'   => $a->id,
                    'name' => $a->name,
                ];
            })->values() : [],
        ];

        return response()->json(['room' => $payload]);
    }

    public function edit(Room $room)
    {
        $room->loadMissing(['photos', 'amenities:id']);

        $optionsPayload = [
            'buildings' => Building::query()->select('id', 'name')->orderBy('name')->get(),
            'floors'    => Floor::query()->select('id', 'level', 'building_id')->orderBy('building_id')->orderBy('level')->get(),
            'types'     => RoomType::query()->select('id', 'name', 'price_cents', 'deposit_cents', 'size_m2')->orderBy('name')->get(),
            'statuses'  => RoomStatus::options(),
            'amenities' => Amenity::query()->select('id', 'name')->orderBy('name')->get(),
        ];

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        $roomPayload = [
            'id'             => (string) $room->id,
            'building_id'    => $room->building_id,
            'floor_id'       => $room->floor_id,
            'room_type_id'   => $room->room_type_id ? (string) $room->room_type_id : null,
            'number'         => $room->number,
            'name'           => $room->name,
            'status'         => $room->status->value,
            'max_occupancy'  => (int) $room->max_occupancy,
            'price_rupiah'   => $room->price_cents === null ? null : (int) round(((int) $room->price_cents) / 100),
            'gender_policy'  => $room->gender_policy->value,
            'billing_period' => $room->billing_period->value,
            'notes'          => $room->notes,
            'photos'         => $room->relationLoaded('photos')
                ? (function () use ($room, $disk) {
                    /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\RoomPhoto> $photos */
                    $photos = $room->photos;

                    return $photos->map(function (\App\Models\RoomPhoto $p) use ($disk) {
                        return [
                            'id'       => $p->id,
                            'url'      => $disk->url($p->path),
                            'is_cover' => (bool) $p->is_cover,
                            'ordering' => (int) ($p->ordering ?? 0),
                        ];
                    });
                })()
                : [],
            'amenities' => $room->relationLoaded('amenities')
                ? $room->amenities->pluck('id')->map(fn ($id) => (int) $id)->values()
                : [],
        ];

        return Inertia::render('management/room/edit', [
            'room'    => $roomPayload,
            'options' => $optionsPayload,
        ]);
    }

    public function update(UpdateRoomRequest $request, Room $room)
    {
        $data = $request->validated();

        $priceCents = array_key_exists('price_rupiah', $data) && $data['price_rupiah'] !== null
            ? (int) round(((float) $data['price_rupiah']))
            : null;

        $attrs = [
            'building_id'    => $data['building_id'],
            'floor_id'       => $data['floor_id'],
            'room_type_id'   => $data['room_type_id'] ?? null,
            'number'         => $data['number'],
            'name'           => $data['name'] ?? null,
            'status'         => $data['status'],
            'max_occupancy'  => $data['max_occupancy'] ?? 1,
            'price_cents'    => $priceCents,
            'gender_policy'  => $data['gender_policy'] ?? null,
            'billing_period' => $data['billing_period'] ?? null,
            'notes'          => $data['notes'] ?? null,
        ];

        DB::transaction(function () use ($room, $attrs, $data): void {
            $room->update($attrs);

            if (!empty($data['amenities']) && is_array($data['amenities'])) {
                $amenityIds = collect($data['amenities'])
                    ->filter(fn ($v) => $v !== null && $v !== '')
                    ->map(fn ($v) => (int) $v)
                    ->all();
                $room->amenities()->sync($amenityIds);
            }

            if (request()->hasFile('photos')) {
                $paths = [];
                foreach ((array) request()->file('photos', []) as $file) {
                    if (!$file) {
                        continue;
                    }
                    $paths[] = $file->store("rooms/{$room->id}", 'public');
                }

                $start    = (int) ($room->photos()->max('ordering') ?? -1);
                $hasCover = $room->photos()->where('is_cover', true)->exists();
                foreach ($paths as $i => $p) {
                    /** @var \App\Models\RoomPhoto $photo */
                    $photo = $room->photos()->create([
                        'path'     => $p,
                        'ordering' => $start + $i + 1,
                        'is_cover' => false,
                    ]);
                    if (!$hasCover && $i === 0) {
                        $photo->is_cover = true;
                        $photo->save();
                        $hasCover = true;
                    }
                }
            }
        });

        return back()->with('success', 'Kamar berhasil diperbarui.');
    }

    public function destroy(Room $room)
    {
        DB::transaction(function () use ($room) {
            // Delete photo files from storage
            foreach ($room->photos as $photo) {
                Storage::disk('public')->delete($photo->path);
            }

            // Delete related photos records
            $room->photos()->delete();

            // Detach amenities
            $room->amenities()->detach();

            // Finally delete the room
            $room->delete();
        });

        return back()->with('success', 'Kamar dan semua fotonya berhasil dihapus.');
    }
}
