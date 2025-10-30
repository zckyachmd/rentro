<?php

namespace App\Http\Controllers\Management;

use App\Enum\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Traits\DataTable;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BookingManagementController extends Controller
{
    use DataTable;

    public function __construct(private ContractServiceInterface $contracts, private NotificationServiceInterface $notifications)
    {
    }

    public function index(Request $request)
    {
        $status = (string) $request->query('status', '');
        $start  = $request->query('start');
        $end    = $request->query('end');

        $driver = DB::connection()->getDriverName();
        $isPg   = $driver === 'pgsql';

        $query = Booking::query()
            ->with([
                'tenant:id,name,email',
                'room:id,number,building_id,room_type_id',
                'room.building:id,name',
                'room.type:id,name',
            ]);

        $options = [
            'search_param' => 'q',
            'searchable'   => [
                'number',
                ['relation' => 'tenant', 'column' => 'name'],
                ['relation' => 'tenant', 'column' => 'email'],
                ['relation' => 'room', 'column' => 'number'],
            ],
            'sortable' => [
                'number'     => 'number',
                'start_date' => 'start_date',
                'duration'   => 'duration_count',
                'status'     => 'status',
                // Sort by related tenant name via subquery
                'tenant' => function ($q, string $dir) {
                    $q->orderBy(
                        User::query()
                            ->select('name')
                            ->whereColumn('users.id', 'bookings.user_id')
                            ->limit(1),
                        $dir,
                    );
                },
                // Sort by related room number via subquery
                'room' => function ($q, string $dir) {
                    $q->orderBy(
                        Room::query()
                            ->select('number')
                            ->whereColumn('rooms.id', 'bookings.room_id')
                            ->limit(1),
                        $dir,
                    );
                },
                // Sort by estimate.total (JSON) if present
                'estimate' => function ($q, string $dir) use ($isPg) {
                    $direction = strtolower($dir) === 'desc' ? 'DESC' : 'ASC';
                    if ($isPg) {
                        $expr = "COALESCE((bookings.estimate->>'total')::bigint, 0)";
                    } else {
                        $expr = "COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(bookings.estimate, '$.total')) AS UNSIGNED), 0)";
                    }
                    $q->orderByRaw("{$expr} {$direction}");
                },
            ],
            'default_sort'      => ['created_at', 'desc'],
            'page_size_default' => 15,
            'filters'           => [
                'status' => function ($q, $status) {
                    if ($status !== '') {
                        $q->where('status', $status);
                    }
                },
                'start' => function ($q, $start) {
                    if (!$start) {
                        return;
                    }
                    try {
                        $d = Carbon::createFromFormat('Y-m-d', (string) $start)->toDateString();
                        $q->whereDate('start_date', '>=', $d);
                    } catch (\Throwable) {
                        // ignore invalid date
                    }
                },
                'end' => function ($q, $end) {
                    if (!$end) {
                        return;
                    }
                    try {
                        $d = Carbon::createFromFormat('Y-m-d', (string) $end)->toDateString();
                        $q->whereDate('start_date', '<=', $d);
                    } catch (\Throwable) {
                        // ignore invalid date
                    }
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<Booking> $page */
        $page = $this->applyTable($query, $request, $options);

        $mapped = $page->getCollection()->map(function (Booking $b) {
            return [
                'id'           => (string) $b->id,
                'number'       => (string) ($b->number ?? ''),
                'status'       => (string) $b->status->value,
                'start_date'   => optional($b->start_date)->toDateString(),
                'duration'     => (int) $b->duration_count,
                'period'       => (string) $b->billing_period->value,
                'promo_code'   => (string) ($b->promo_code ?? ''),
                'tenant'       => $b->tenant?->name,
                'tenant_email' => $b->tenant?->email,
                'room'         => $b->room?->number,
                'building'     => $b->room?->building?->name,
                'type'         => $b->room?->type?->name,
                'estimate'     => $b->estimate,
            ];
        });

        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        // Summary (respect simple filters)
        $sumBase = Booking::query();
        if ($status !== '') {
            $sumBase->where('status', $status);
        }
        if ($start) {
            try {
                $d = Carbon::createFromFormat('Y-m-d', (string) $start)->toDateString();
                $sumBase->whereDate('start_date', '>=', $d);
            } catch (\Throwable) {
            }
        }
        if ($end) {
            try {
                $d = Carbon::createFromFormat('Y-m-d', (string) $end)->toDateString();
                $sumBase->whereDate('start_date', '<=', $d);
            } catch (\Throwable) {
            }
        }
        $countAll       = (int) $sumBase->count('id');
        $countRequested = (int) (clone $sumBase)->where('status', BookingStatus::REQUESTED->value)->count('id');
        $countApproved  = (int) (clone $sumBase)->where('status', BookingStatus::APPROVED->value)->count('id');
        $countRejected  = (int) (clone $sumBase)->where('status', BookingStatus::REJECTED->value)->count('id');

        return Inertia::render('management/booking/index', [
            'bookings' => $payload,
            'query'    => [
                'page'    => $payload['current_page'],
                'perPage' => $payload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'status'  => $status,
                'q'       => (string) $request->query('q', ''),
                'start'   => $start,
                'end'     => $end,
            ],
            'options' => [
                'statuses' => BookingStatus::options(),
            ],
            'summary' => [
                'count'           => $countAll,
                'count_requested' => $countRequested,
                'count_approved'  => $countApproved,
                'count_rejected'  => $countRejected,
            ],
        ]);
    }

    public function export(Request $request)
    {
        $q = Booking::query()->with([
            'tenant:id,name,email',
            'room:id,number,name,building_id,room_type_id',
            'room.building:id,name',
            'room.type:id,name',
        ]);

        $status = (string) $request->query('status', '');
        if ($status !== '') {
            $q->where('status', $status);
        }
        $start = $request->query('start');
        $end   = $request->query('end');
        if ($start) {
            try {
                $d = Carbon::createFromFormat('Y-m-d', (string) $start)->toDateString();
                $q->whereDate('start_date', '>=', $d);
            } catch (\Throwable) {
            }
        }
        if ($end) {
            try {
                $d = Carbon::createFromFormat('Y-m-d', (string) $end)->toDateString();
                $q->whereDate('start_date', '<=', $d);
            } catch (\Throwable) {
            }
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
                        $r->where('number', $like, "%{$search}%")
                            ->orWhere('name', $like, "%{$search}%");
                    });
            });
        }

        $q->orderByDesc('created_at')->orderByDesc('id');

        $filename = 'bookings_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($q): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'Number',
                'Start Date',
                'Status',
                'Tenant',
                'Room',
                'Building',
                'Type',
                'Duration',
                'Period',
                'Estimate Total (cents)',
                'Promo Code',
            ]);
            $q->chunk(1000, function ($rows) use ($out) {
                foreach ($rows as $b) {
                    /** @var Booking $b */
                    $estimate = is_array($b->estimate) ? $b->estimate : [];
                    fputcsv($out, [
                        (string) ($b->number ?? (string) $b->id),
                        optional($b->start_date)->toDateString(),
                        (string) $b->status->value,
                        optional($b->tenant)->name,
                        optional($b->room)->number ?? optional($b->room)->name,
                        optional($b->room?->building)->name,
                        optional($b->room?->type)->name,
                        (int) $b->duration_count,
                        (string) $b->billing_period->value,
                        (int) ($estimate['total'] ?? 0),
                        (string) ($b->promo_code ?? ''),
                    ]);
                }
            });
            fclose($out);
        }, $filename, [
            'Content-Type'        => 'text/csv',
            'Cache-Control'       => 'no-store, no-cache, must-revalidate',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function show(Booking $booking)
    {
        $booking->load([
            'tenant:id,name,email,phone',
            'room:id,number,name,building_id,room_type_id,floor_id,size_m2,status,gender_policy,max_occupancy,notes',
            'room.building:id,name',
            'room.type:id,name',
            'room.floor:id,name',
            'room.photos:id,room_id,path,is_cover,ordering',
            'room.amenities:id,name,icon',
        ]);

        return Inertia::render('management/booking/detail', [
            'booking' => [
                'id'                => (string) $booking->id,
                'number'            => (string) ($booking->number ?? ''),
                'status'            => (string) $booking->status->value,
                'status_changed_at' => optional($booking->approved_at ?? $booking->rejected_at ?? $booking->updated_at ?? $booking->created_at)->toDateTimeString(),
                'start_date'        => optional($booking->start_date)->toDateString(),
                'duration'          => (int) $booking->duration_count,
                'period'            => (string) $booking->billing_period->value,
                'promo_code'        => (string) ($booking->promo_code ?? ''),
                'notes'             => (string) ($booking->notes ?? ''),
                'tenant'            => $booking->tenant ? [
                    'name'  => $booking->tenant->name,
                    'email' => $booking->tenant->email,
                    'phone' => method_exists($booking->tenant, 'getAttribute') ? ($booking->tenant->getAttribute('phone') ?? null) : null,
                ] : null,
                'room' => $booking->room ? (function () use ($booking) {
                    $r           = $booking->room;
                    $status      = $r->status;
                    $gender      = $r->gender_policy;
                    $statusValue = ($status instanceof \BackedEnum) ? (string) $status->value : (is_string($status) ? $status : (string) $status);
                    $genderValue = ($gender instanceof \BackedEnum) ? (string) $gender->value : (is_string($gender) ? $gender : (string) $gender);

                    $photos = $r->photos->map(fn ($p) => [
                        'id'       => (string) $p->id,
                        'url'      => Storage::url((string) $p->path),
                        'is_cover' => (bool) $p->is_cover,
                        'ordering' => (int) ($p->ordering ?? 0),
                    ])->all();
                    $amenities = $r->amenities->map(fn ($a) => [
                        'id'   => (int) $a->id,
                        'name' => (string) $a->name,
                        'icon' => (string) ($a->icon ?? ''),
                    ])->all();

                    $prices   = $r->effectivePrices();
                    $deposits = $r->effectiveDeposits();

                    return [
                        'id'            => (string) $r->id,
                        'number'        => $r->number,
                        'name'          => $r->name,
                        'building'      => $r->building?->name,
                        'type'          => $r->type?->name,
                        'floor'         => $r->floor?->name,
                        'size_m2'       => $r->size_m2 ? (string) $r->size_m2 : null,
                        'status'        => $statusValue,
                        'gender_policy' => $genderValue,
                        'max_occupancy' => $r->max_occupancy ? (int) $r->max_occupancy : null,
                        'photos'        => $photos,
                        'amenities'     => $amenities,
                        'prices'        => $prices,
                        'deposits'      => $deposits,
                        'notes'         => (string) ($r->notes ?? ''),
                    ];
                })() : null,
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
            return back()->with('error', $e->getMessage());
        }

        try {
            $title     = __('notifications.booking.approved.title');
            $message   = __('notifications.booking.approved.message', ['number' => (string) ($booking->number ?? $booking->id)]);
            $actionUrl = null;
            $this->notifications->notifyUser((int) $booking->user_id, $title, $message, $actionUrl, [
                'scope'      => 'user',
                'type'       => 'booking',
                'booking_id' => (string) $booking->id,
                'status'     => 'approved',
            ]);
        } catch (\Throwable) {
            // Swallow notification errors to not block UX
        }

        return back()->with('success', __('management/bookings.approved'));
    }

    public function reject(Request $request, Booking $booking)
    {
        if ($booking->status !== BookingStatus::REQUESTED) {
            return back()->with('error', __('management/bookings.reject_invalid_state'));
        }

        $reason = trim((string) $request->input('reason', ''));

        $booking->forceFill([
            'status'      => BookingStatus::REJECTED,
            'rejected_at' => now(),
            'notes'       => $reason !== '' ? $reason : '-',
        ])->save();

        try {
            $title     = __('notifications.booking.rejected.title');
            $message   = __('notifications.booking.rejected.message', ['number' => (string) ($booking->number ?? $booking->id)]);
            $actionUrl = null;
            $this->notifications->notifyUser((int) $booking->user_id, $title, $message, $actionUrl, [
                'scope'      => 'user',
                'type'       => 'booking',
                'booking_id' => (string) $booking->id,
                'status'     => 'rejected',
                'reason'     => $reason,
            ]);
        } catch (\Throwable) {
        }

        return back()->with('success', __('management/bookings.rejected'));
    }
}
