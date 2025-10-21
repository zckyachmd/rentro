<?php

namespace App\Http\Controllers\Management;

use App\Enum\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\Contracts\ContractServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BookingManagementController extends Controller
{
    public function __construct(private ContractServiceInterface $contracts)
    {
    }

    public function index(Request $request)
    {
        $status = (string) $request->query('status', BookingStatus::REQUESTED->value);

        $q = Booking::query()
            ->with(['tenant:id,name,email', 'room:id,number,building_id,room_type_id', 'room.building:id,name', 'room.type:id,name'])
            ->orderByDesc('created_at');
        if ($status !== '') {
            $q->where('status', $status);
        }
        $search = (string) $request->query('q', '');
        if ($search !== '') {
            $like = config('database.default') === 'pgsql' ? 'ILIKE' : 'LIKE';
            $q->where(function ($qq) use ($search, $like) {
                $qq->orWhere('number', $like, "%{$search}%")
                    ->orWhereHas('tenant', function ($t) use ($search, $like) {
                        $t->where('name', $like, "%{$search}%")
                            ->orWhere('email', $like, "%{$search}%");
                    })
                    ->orWhereHas('room', function ($r) use ($search, $like) {
                        $r->where('number', $like, "%{$search}%");
                    });
            });
        }

        $page = $q->paginate(15)->through(function (Booking $b) {
            return [
                'id'         => (string) $b->id,
                'number'     => (string) ($b->number ?? ''),
                'status'     => (string) $b->status->value,
                'start_date' => optional($b->start_date)->toDateString(),
                'duration'   => (int) $b->duration_count,
                'period'     => (string) $b->billing_period->value,
                'promo_code' => (string) ($b->promo_code ?? ''),
                'tenant'     => $b->tenant?->name,
                'room'       => $b->room?->number,
                'building'   => $b->room?->building?->name,
                'type'       => $b->room?->type?->name,
                'estimate'   => $b->estimate,
            ];
        });

        return Inertia::render('management/booking/index', [
            'bookings' => $page,
            'query'    => [
                'status' => $status,
                'q'      => $search,
            ],
            'options' => [
                'statuses' => BookingStatus::options(),
            ],
        ]);
    }

    public function show(Booking $booking)
    {
        $booking->load(['tenant:id,name,email', 'room:id,number,name,building_id,room_type_id', 'room.building:id,name', 'room.type:id,name']);

        return Inertia::render('management/booking/detail', [
            'booking' => [
                'id'         => (string) $booking->id,
                'number'     => (string) ($booking->number ?? ''),
                'status'     => (string) $booking->status->value,
                'start_date' => optional($booking->start_date)->toDateString(),
                'duration'   => (int) $booking->duration_count,
                'period'     => (string) $booking->billing_period->value,
                'promo_code' => (string) ($booking->promo_code ?? ''),
                'notes'      => (string) ($booking->notes ?? ''),
                'tenant'     => $booking->tenant ? [
                    'name'  => $booking->tenant->name,
                    'email' => $booking->tenant->email,
                ] : null,
                'room' => $booking->room ? [
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

    public function approve(Request $request, Booking $booking)
    {
        if ($booking->status !== BookingStatus::REQUESTED) {
            return back()->with('error', __('management/bookings.approve_invalid_state'));
        }

        try {
            DB::transaction(function () use ($booking): void {
                $payload = [
                    'user_id'              => (int) $booking->user_id,
                    'room_id'              => (int) $booking->room_id,
                    'start_date'           => $booking->start_date->toDateString(),
                    'duration_count'       => (int) $booking->duration_count,
                    'billing_period'       => (string) $booking->billing_period->value,
                    'monthly_payment_mode' => 'per_month',
                    'notes'                => 'Approved from booking ' . ($booking->number ?? (string) $booking->id),
                ];
                if (!empty($booking->promo_code)) {
                    $payload['promo'] = [
                        'channel'     => 'public',
                        'coupon_code' => (string) $booking->promo_code,
                    ];
                }

                $contract = $this->contracts->create($payload);

                $booking->forceFill([
                    'status'      => BookingStatus::APPROVED,
                    'approved_at' => now(),
                    'contract_id' => $contract->id,
                ])->save();
            });
        } catch (\Throwable $e) {
            return back()->with('error', __('management/bookings.approve_failed'));
        }

        return back()->with('success', __('management/bookings.approved'));
    }

    public function reject(Request $request, Booking $booking)
    {
        if ($booking->status !== BookingStatus::REQUESTED) {
            return back()->with('error', __('management/bookings.reject_invalid_state'));
        }

        $reason = (string) $request->input('reason', '');

        $booking->forceFill([
            'status'      => BookingStatus::REJECTED,
            'rejected_at' => now(),
            'notes'       => trim($booking->notes . "\nReject reason: " . $reason),
        ])->save();

        return back()->with('success', __('management/bookings.rejected'));
    }
}
