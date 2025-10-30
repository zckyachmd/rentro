<?php

namespace App\Http\Controllers\Tenant;

use App\Enum\BillingPeriod;
use App\Enum\BookingStatus;
use App\Enum\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\Booking\StoreBookingRequest;
use App\Models\AppSetting;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Services\Contracts\NotificationServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class BookingController extends Controller
{
    public function __construct(private NotificationServiceInterface $notifications)
    {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Booking::query()
            ->with(['room:id,number,name,building_id,floor_id,room_type_id', 'room.building:id,name', 'room.type:id,name'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        $bookings = $query->paginate(10)->through(function (Booking $b) {
            return [
                'id'         => (string) $b->id,
                'number'     => (string) ($b->number ?? ''),
                'status'     => (string) $b->status->value,
                'start_date' => optional($b->start_date)->toDateString(),
                'duration'   => (int) $b->duration_count,
                'period'     => (string) $b->billing_period->value,
                'promo_code' => (string) ($b->promo_code ?? ''),
                'room'       => $b->room ? [
                    'number'   => $b->room->number,
                    'name'     => $b->room->name,
                    'building' => $b->room->building?->name,
                    'type'     => $b->room->type?->name,
                ] : null,
                'estimate'   => $b->estimate,
                'created_at' => optional($b->created_at)->toDateTimeString(),
            ];
        });

        return Inertia::render('tenant/booking/index', [
            'bookings' => $bookings,
        ]);
    }

    public function show(Request $request, Booking $booking)
    {
        $this->authorizeBookingOwner($request->user(), $booking);

        $booking->load(['room.building', 'room.type']);

        return Inertia::render('tenant/booking/detail', [
            'booking' => [
                'id'         => (string) $booking->id,
                'number'     => (string) ($booking->number ?? ''),
                'status'     => (string) $booking->status->value,
                'start_date' => optional($booking->start_date)->toDateString(),
                'duration'   => (int) $booking->duration_count,
                'period'     => (string) $booking->billing_period->value,
                'promo_code' => (string) ($booking->promo_code ?? ''),
                'notes'      => (string) ($booking->notes ?? ''),
                'room'       => $booking->room ? [
                    'number'   => $booking->room->number,
                    'name'     => $booking->room->name,
                    'building' => $booking->room->building?->name,
                    'type'     => $booking->room->type?->name,
                ] : null,
                'estimate'    => $booking->estimate,
                'contract_id' => $booking->contract_id ? (string) $booking->contract_id : null,
            ],
        ]);
    }

    public function store(StoreBookingRequest $request)
    {
        $data   = $request->validated();
        $user   = $request->user();
        $room   = Room::query()->with(['building', 'type'])->whereKey($data['room_id'])->firstOrFail();
        $start  = Carbon::parse($data['start_date'])->startOfDay();
        $period = (string) $data['billing_period'];
        $months = (int) $data['duration_count'];
        $coupon = (string) ($data['promo_code'] ?? '');

        $rentBase    = (int) ($room->effectivePriceCents($period) ?? 0);
        $depositBase = (int) ($room->effectiveDepositCents($period) ?? 0);
        $promoCtx    = [
            'user'                  => $user,
            'channel'               => 'public',
            'coupon_code'           => $coupon !== '' ? $coupon : null,
            'base_rent_override'    => $rentBase,
            'base_deposit_override' => $depositBase,
        ];
        $eval = app(\App\Services\Contracts\PromotionServiceInterface::class)
            ->evaluateForRoom($room, BillingPeriod::from($period), $promoCtx);
        $finalRent    = (int) ($eval['final_rent'] ?? $rentBase);
        $finalDeposit = (int) ($eval['final_deposit'] ?? $depositBase);
        $estimate     = [
            'base_rent'     => $rentBase,
            'base_deposit'  => $depositBase,
            'final_rent'    => $finalRent,
            'final_deposit' => $finalDeposit,
            'duration'      => $months,
            'total'         => ($finalRent * max(1, $months)) + $finalDeposit,
            'promo'         => [
                'coupon_code' => $coupon !== '' ? $coupon : null,
                'applied'     => array_map(function ($a) {
                    /** @var array{promotion:\App\Models\Promotion,discount_rent:int,discount_deposit:int,actions:array,coupon_id?:int|null} $a */
                    $p = $a['promotion'];

                    return [
                        'id'               => $p->id,
                        'name'             => $p->name,
                        'discount_rent'    => (int) $a['discount_rent'],
                        'discount_deposit' => (int) $a['discount_deposit'],
                        'coupon_id'        => $a['coupon_id'] ?? null,
                    ];
                }, $eval['applied'] ?? []),
            ],
        ];

        try {
            $booking = DB::transaction(function () use ($user, $room, $start, $months, $period, $data, $estimate) {
                $seq     = $this->nextGlobalBookingSequence();
                $num     = 'BKG-' . $start->format('Ymd') . '-' . sprintf('%04d', $seq);
                $booking = Booking::create([
                    'number'         => $num,
                    'user_id'        => $user->id,
                    'room_id'        => $room->id,
                    'start_date'     => $start->toDateString(),
                    'duration_count' => (int) $months,
                    'billing_period' => $period,
                    'promo_code'     => $data['promo_code'] ?? null,
                    'notes'          => $data['notes'] ?? null,
                    'status'         => BookingStatus::REQUESTED,
                    'estimate'       => $estimate,
                ]);

                return $booking;
            });
        } catch (\Throwable $e) {
            Log::error('Booking create failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', __('tenant/booking.create_failed'));
        }

        try {
            $roleNames = array_filter(array_map('trim', (array) config('notifications.management_roles.booking_requested', [RoleName::MANAGER->value])));
            if ($roleNames !== []) {
                $roleIds = Role::query()->whereIn('name', $roleNames)->pluck('id')->map(fn ($id) => (int) $id)->all();
                if (!empty($roleIds)) {
                    $title   = ['key' => 'notifications.content.booking.requested.title'];
                    $message = [
                        'key'    => 'notifications.content.booking.requested.message',
                        'params' => ['number' => (string) ($booking->number ?? $booking->id)],
                    ];
                    $persist = (bool) (config('notifications.persist_roles.booking_requested') ?? false);
                    foreach ($roleIds as $rid) {
                        $actionUrl = route('management.bookings.show', ['booking' => $booking->id]);
                        $this->notifications->announceRole($rid, $title, $message, $actionUrl, $persist);
                    }
                }
            }
        } catch (\Throwable) {
            // ignore;
        }

        try {
            $title   = ['key' => 'notifications.content.booking.requested.title'];
            $message = [
                'key'    => 'notifications.content.booking.requested.message',
                'params' => ['number' => (string) ($booking->number ?? $booking->id)],
            ];
            $actionUrl = route('tenant.bookings.show', ['booking' => $booking->id]);
            $this->notifications->notifyUser((int) $user->id, $title, $message, $actionUrl, [
                'scope'      => 'user',
                'type'       => 'booking',
                'booking_id' => (string) $booking->id,
                'status'     => 'requested',
            ]);
        } catch (\Throwable) {
            // ignore;
        }

        return redirect()->route('tenant.bookings.show', ['booking' => $booking->id])
            ->with('success', __('tenant/booking.created'));
    }

    protected function authorizeBookingOwner(User $user, Booking $booking): void
    {
        if ((int) $booking->user_id !== (int) $user->id) {
            abort(403);
        }
    }

    /**
     * Atomically increment and return next global booking sequence.
     */
    protected function nextGlobalBookingSequence(): int
    {
        return DB::transaction(function () {
            $row = AppSetting::query()
                ->where('key', 'booking.global_sequence')
                ->lockForUpdate()
                ->first();
            if (!$row) {
                $row = new AppSetting([
                    'key'   => 'booking.global_sequence',
                    'type'  => 'int',
                    'value' => 0,
                ]);
                $row->save();
            }
            $current = (int) ($row->getAttribute('value') ?? 0);
            $next    = $current + 1;
            $row->setAttribute('value', $next);
            $row->type = 'int';
            $row->save();

            return $next;
        });
    }
}
