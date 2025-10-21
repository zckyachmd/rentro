<?php

namespace App\Http\Controllers\Tenant;

use App\Enum\RoomStatus;
use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\Request;
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

        $q = Room::query()
            ->select('id', 'number', 'name', 'status', 'room_type_id', 'building_id', 'floor_id', 'price_overrides', 'deposit_overrides')
            ->with(['type:id,name,prices', 'building:id,name,code'])
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
                'id'          => (string) $r->id,
                'number'      => $r->number,
                'name'        => $r->name,
                'building'    => $r->building?->name,
                'type'        => $r->type?->name,
                'status'      => (string) $r->status->value,
                'price_month' => (int) ($r->effectivePriceCents('monthly') ?? 0),
                'deposit'     => (int) ($r->effectiveDepositCents('monthly') ?? 0),
            ];
        });

        return Inertia::render('tenant/booking/browse', [
            'rooms' => $rooms,
            'query' => [
                'building' => $building,
                'type'     => $type,
            ],
        ]);
    }
}
