<?php

namespace App\Http\Controllers\Tenant;

use App\Enum\RoomStatus;
use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RoomBrowseController extends Controller
{
    public function index(Request $request)
    {
        $building = (string) $request->query('building', '');
        $type     = (string) $request->query('type', '');

        $softHoldHours = (int) AppSetting::config('booking.soft_hold_hours', 48);
        $softHoldHours = max(0, $softHoldHours);
        $holdThreshold = Carbon::now()->subHours($softHoldHours)->toDateTimeString();

        $base = Room::query()
            ->select('id', 'number', 'name', 'status', 'room_type_id', 'building_id', 'floor_id', 'price_overrides', 'deposit_overrides', 'size_m2', 'max_occupancy')
            ->with([
                'type:id,name,prices',
                'building:id,name,code',
            ])
            ->where('status', RoomStatus::VACANT->value)
            ->whereDoesntHave('holdingContracts')
            // Soft hold: hide rooms with recent booking requests (last 48 hours)
            ->whereNotExists(function ($sub) use ($holdThreshold) {
                $sub->selectRaw('1')
                    ->from('bookings')
                    ->whereColumn('bookings.room_id', 'rooms.id')
                    ->where('bookings.status', 'requested')
                    ->where('bookings.created_at', '>=', $holdThreshold);
            })
            ->orderBy('number');

        // Options (without applying current filter), unique building names & types
        $buildings = (clone $base)
            ->with('building:id,name')
            ->get()
            ->pluck('building.name')
            ->filter()
            ->unique()
            ->values()
            ->all();
        $types = (clone $base)
            ->with('type:id,name')
            ->get()
            ->pluck('type.name')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $q = clone $base;

        if ($building !== '') {
            $q->whereHas('building', function ($b) use ($building) {
                $like = config('database.default') === 'pgsql' ? 'ILIKE' : 'LIKE';
                $b->where('name', $like, "%{$building}%");
            });
        }
        if ($type !== '') {
            $q->whereHas('type', function ($t) use ($type) {
                $like = config('database.default') === 'pgsql' ? 'ILIKE' : 'LIKE';
                $t->where('name', $like, "%{$type}%");
            });
        }

        $rooms = $q->paginate(12)->through(function (Room $r) {
            return [
                'id'            => (string) $r->id,
                'number'        => $r->number,
                'name'          => $r->name,
                'building'      => $r->building?->name,
                'type'          => $r->type?->name,
                'status'        => (string) $r->status->value,
                'price_month'   => (int) ($r->effectivePriceCents('monthly') ?? 0),
                'deposit'       => (int) ($r->effectiveDepositCents('monthly') ?? 0),
                'size_m2'       => $r->size_m2 !== null ? (float) $r->size_m2 : null,
                'max_occupancy' => $r->max_occupancy !== null ? (int) $r->max_occupancy : null,
            ];
        });

        return Inertia::render('tenant/booking/browse', [
            'rooms' => $rooms,
            'query' => [
                'building' => $building,
                'type'     => $type,
            ],
            'options' => [
                'buildings' => $buildings,
                'types'     => $types,
            ],
        ]);
    }

    public function show(Room $room)
    {
        $room->loadMissing(['building:id,name', 'type:id,name', 'photos:id,room_id,path,is_cover,ordering', 'amenities:id,name']);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        $photos = $room->relationLoaded('photos')
            ? $room->photos
                ->sortBy(function ($p) {
                    /* @var \App\Models\RoomPhoto $p */
                    return ($p->is_cover ? -1 : 0) * 1000 + (int) ($p->ordering ?? 0);
                })
                ->map(fn ($p) => $disk->url($p->path))
                ->values()
                ->all()
            : [];

        $payload = [
            'id'            => (string) $room->id,
            'number'        => $room->number,
            'name'          => $room->name,
            'building'      => $room->building?->name,
            'type'          => $room->type?->name,
            'status'        => (string) $room->status->value,
            'price_month'   => (int) ($room->effectivePriceCents('monthly') ?? 0),
            'deposit'       => (int) ($room->effectiveDepositCents('monthly') ?? 0),
            'size_m2'       => $room->size_m2 !== null ? (float) $room->size_m2 : null,
            'max_occupancy' => $room->max_occupancy !== null ? (int) $room->max_occupancy : null,
            'photo_urls'    => $photos,
            'amenities'     => $room->relationLoaded('amenities')
                ? $room->amenities->pluck('name')->filter()->values()->all()
                : [],
        ];

        return response()->json(['room' => $payload]);
    }
}
