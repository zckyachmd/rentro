<?php

namespace App\Http\Controllers\Management;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Enum\RoleName;
use App\Enum\RoomStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\ReasonRequest;
use App\Http\Requests\Management\Contract\SetAutoRenewRequest;
use App\Http\Requests\Management\Contract\StoreContractRequest;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Room;
use App\Models\RoomHandover;
use App\Models\User;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContractManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function __construct(private ContractServiceInterface $contracts, private NotificationServiceInterface $notifications)
    {
    }

    public function index(Request $request)
    {
        $query = Contract::query();

        $options = [
            'select' => [
                'id',
                'number',
                'user_id',
                'room_id',
                'start_date',
                'end_date',
                'rent_idr',
                'status',
                'auto_renew',
                'notes',
            ],
            'with' => [
                'tenant:id,name,email',
                'room:id,number,building_id,floor_id',
            ],
            'search_param' => 'q',
            'sortable'     => [
                'start_date' => 'start_date',
                'end_date'   => 'end_date',
                'rent'       => 'rent_idr',
                'status'     => 'status',
                'created_at' => 'created_at',
            ],
            'default_sort' => ['created_at', 'desc'],
            'filters'      => [
                'status' => fn ($q, $v) => $q->where('status', $v),
                'start'  => function ($q, $v) {
                    try {
                        $d = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $v)->toDateString();
                    } catch (\Throwable) {
                        return;
                    }
                    $q->whereDate('start_date', '>=', $d);
                },
                'end' => function ($q, $v) {
                    try {
                        $d = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $v)->toDateString();
                    } catch (\Throwable) {
                        return;
                    }
                    $q->whereDate('start_date', '<=', $d);
                },
                'q' => function ($q, $v) {
                    $term = trim((string) $v);
                    if ($term === '') {
                        return;
                    }
                    $like = $this->tableLikeOperator();
                    $q->where(function ($qq) use ($term, $like) {
                        $qq->orWhere('number', $like, "%{$term}%")
                            ->orWhere('notes', $like, "%{$term}%")
                            ->orWhereHas('tenant', function ($t) use ($term, $like) {
                                $t->where('name', $like, "%{$term}%")
                                    ->orWhere('email', $like, "%{$term}%");
                            })
                            ->orWhereHas('room', function ($r) use ($term, $like) {
                                $r->where('number', $like, "%{$term}%")
                                    ->orWhere('name', $like, "%{$term}%");
                            });
                    });
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<Contract> $page */
        $page = $this->applyTable($query, $request, $options);

        $collection  = $page->getCollection();
        $contractIds = $collection->pluck('id')->all();

        $confirmedCheckinIds = RoomHandover::query()
            ->select('contract_id')
            ->whereIn('contract_id', $contractIds)
            ->where('type', \App\Enum\RoomHandoverType::CHECKIN->value)
            ->where('status', \App\Enum\RoomHandoverStatus::CONFIRMED->value)
            ->pluck('contract_id')
            ->unique()
            ->flip();

        $confirmedCheckoutIds = RoomHandover::query()
            ->select('contract_id')
            ->whereIn('contract_id', $contractIds)
            ->where('type', \App\Enum\RoomHandoverType::CHECKOUT->value)
            ->where('status', \App\Enum\RoomHandoverStatus::CONFIRMED->value)
            ->pluck('contract_id')
            ->unique()
            ->flip();

        $latestCheckinByContract = RoomHandover::query()
            ->whereIn('contract_id', $contractIds)
            ->where('type', \App\Enum\RoomHandoverType::CHECKIN->value)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['contract_id', 'status'])
            ->unique('contract_id')
            ->keyBy('contract_id');

        $latestCheckoutByContract = RoomHandover::query()
            ->whereIn('contract_id', $contractIds)
            ->where('type', \App\Enum\RoomHandoverType::CHECKOUT->value)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['contract_id', 'status'])
            ->unique('contract_id')
            ->keyBy('contract_id');

        $mapped = $collection->map(function (Contract $c) use (
            $confirmedCheckinIds,
            $confirmedCheckoutIds,
            $latestCheckinByContract,
            $latestCheckoutByContract
        ): array {
            $tenant = $c->tenant;
            $room   = $c->room;

            $hasConfirmedCheckin  = $confirmedCheckinIds->has($c->id);
            $hasConfirmedCheckout = $confirmedCheckoutIds->has($c->id);
            $latestCheckinStatus  = optional($latestCheckinByContract->get($c->id))->status;
            $latestCheckoutStatus = optional($latestCheckoutByContract->get($c->id))->status;

            return [
                'id'                          => (string) $c->id,
                'number'                      => (string) ($c->number ?? ''),
                'tenant'                      => $tenant ? ['id' => $tenant->id, 'name' => $tenant->name, 'email' => $tenant->email] : null,
                'room'                        => $room ? ['id' => (string) $room->id, 'number' => $room->number] : null,
                'start_date'                  => $c->start_date->format('Y-m-d'),
                'end_date'                    => $c->end_date?->format('Y-m-d'),
                'rent_idr'                    => (int) $c->rent_idr,
                'status'                      => $c->status->value,
                'status_label'                => method_exists($c->status, 'label') ? $c->status->label() : (string) $c->status->value,
                'auto_renew'                  => (bool) $c->auto_renew,
                'has_checkin'                 => (bool) $hasConfirmedCheckin,
                'has_checkout'                => (bool) $hasConfirmedCheckout,
                'latest_checkin_status'       => $latestCheckinStatus ? (string) ($latestCheckinStatus instanceof \BackedEnum ? $latestCheckinStatus->value : $latestCheckinStatus) : null,
                'latest_checkout_status'      => $latestCheckoutStatus ? (string) ($latestCheckoutStatus instanceof \BackedEnum ? $latestCheckoutStatus->value : $latestCheckoutStatus) : null,
                'latest_checkin_status_label' => ($latestCheckinStatus instanceof \BackedEnum)
                    ? __('enum.handover.status.' . strtolower($latestCheckinStatus->name))
                    : (is_string($latestCheckinStatus)
                        ? __('enum.handover.status.' . strtolower($latestCheckinStatus))
                        : null),
                'latest_checkout_status_label' => ($latestCheckoutStatus instanceof \BackedEnum)
                    ? __('enum.handover.status.' . strtolower($latestCheckoutStatus->name))
                    : (is_string($latestCheckoutStatus)
                        ? __('enum.handover.status.' . strtolower($latestCheckoutStatus))
                        : null),
            ];
        });
        $page->setCollection($mapped);

        $contractsPayload = $this->tablePaginate($page);

        $handoverSettings = [
            'min_photos_checkin'              => (int) AppSetting::config('handover.min_photos_checkin', 0),
            'min_photos_checkout'             => (int) AppSetting::config('handover.min_photos_checkout', 0),
            'require_tenant_ack_for_complete' => (bool) AppSetting::config('handover.require_tenant_ack_for_complete', false),
            'require_checkin_for_activate'    => (bool) AppSetting::config('handover.require_checkin_for_activate', true),
        ];

        // Summary (respect filters)
        $sumBase = Contract::query();
        // Apply simple filters
        $status = (string) $request->query('status', '');
        if ($status !== '') {
            $sumBase->where('status', $status);
        }
        $start = $request->query('start');
        $end   = $request->query('end');
        if ($start) {
            try {
                $d = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $start)->toDateString();
                $sumBase->whereDate('start_date', '>=', $d);
            } catch (\Throwable) {
            }
        }
        if ($end) {
            try {
                $d = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $end)->toDateString();
                $sumBase->whereDate('start_date', '<=', $d);
            } catch (\Throwable) {
            }
        }
        $countAll     = (int) $sumBase->count('id');
        $countActive  = (int) (clone $sumBase)->where('status', ContractStatus::ACTIVE->value)->count('id');
        $countBooked  = (int) (clone $sumBase)->where('status', ContractStatus::BOOKED->value)->count('id');
        $countPending = (int) (clone $sumBase)->where('status', ContractStatus::PENDING_PAYMENT->value)->count('id');
        $countOverdue = (int) (clone $sumBase)->where('status', ContractStatus::OVERDUE->value)->count('id');

        return Inertia::render('management/contract/index', [
            'contracts' => $contractsPayload,
            'options'   => [
                'statuses' => ContractStatus::options(),
            ],
            'handover' => $handoverSettings,
            'summary'  => [
                'count'         => $countAll,
                'count_active'  => $countActive,
                'count_booked'  => $countBooked,
                'count_pending' => $countPending,
                'count_overdue' => $countOverdue,
            ],
            'query' => [
                'page'    => $contractsPayload['current_page'],
                'perPage' => $contractsPayload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'status'  => $request->query('status'),
                'q'       => $request->query('q'),
                'start'   => $request->query('start'),
                'end'     => $request->query('end'),
            ],
        ]);
    }

    public function create()
    {
        $today = now()->toDateString();

        $tenants = User::role(RoleName::TENANT->value)
            ->select('id', 'name', 'email')
            ->whereDoesntHave('contracts', function ($q) use ($today) {
                $q->whereIn('status', [ContractStatus::PENDING_PAYMENT->value, ContractStatus::BOOKED->value, ContractStatus::ACTIVE->value])
                    ->where(function ($qq) use ($today) {
                        $qq->whereNull('end_date')->orWhere('end_date', '>=', $today);
                    });
            })
            ->orderBy('name')
            ->get();

        $leadDays  = (int) AppSetting::config('contract.prebook_lead_days', 7);
        $threshold = now()->copy()->addDays(max(1, $leadDays))->startOfDay()->toDateString();

        $vacantRooms = Room::query()
            ->select('id', 'number', 'name', 'price_overrides', 'deposit_overrides', 'room_type_id', 'building_id', 'floor_id', 'status')
            ->where('status', RoomStatus::VACANT->value)
            ->with([
                'type:id,prices,deposits',
                'building:id,name,code',
                'floor:id,level,building_id',
            ])
            ->orderBy('number')
            ->get();

        $prebookRooms = Room::query()
            ->select('id', 'number', 'name', 'price_overrides', 'deposit_overrides', 'room_type_id', 'building_id', 'floor_id', 'status')
            ->whereHas('contracts', function ($q) use ($today, $threshold) {
                $q->where('status', ContractStatus::ACTIVE->value)
                    ->whereNotNull('end_date')
                    ->whereBetween('end_date', [$today, $threshold])
                    ->where(function ($w) {
                        $w->where('auto_renew', false)
                            ->orWhereNotNull('renewal_cancelled_at');
                    });
            })
            ->whereDoesntHave('contracts', function ($q) use ($today) {
                $q->whereIn('status', [
                    ContractStatus::PENDING_PAYMENT->value,
                    ContractStatus::BOOKED->value,
                    ContractStatus::ACTIVE->value,
                ])->whereDate('start_date', '>', $today);
            })
            ->with([
                'type:id,prices,deposits',
                'building:id,name,code',
                'floor:id,level,building_id',
            ])
            ->orderBy('number')
            ->get();

        $rooms = $vacantRooms->concat($prebookRooms)
            ->unique('id')
            ->values()
            ->map(function (Room $r) {
                return [
                    'id'       => (string) $r->id,
                    'number'   => $r->number,
                    'name'     => $r->name,
                    'prices'   => $r->effectivePrices(),
                    'deposits' => $r->effectiveDeposits(),
                    'building' => $r->building ? [
                        'id'   => $r->building->id,
                        'name' => $r->building->name,
                        'code' => $r->building->code,
                    ] : null,
                    'floor' => $r->floor ? [
                        'id'    => $r->floor->id,
                        'level' => $r->floor->level,
                    ] : null,
                    'building_name' => $r->building?->name,
                    'floor_level'   => $r->floor?->level,
                ];
            });

        $contractSettings = [
            'auto_renew_default'    => AppSetting::config('contract.auto_renew_default', false),
            'daily_max_days'        => AppSetting::config('contract.daily_max_days', 5),
            'weekly_max_weeks'      => AppSetting::config('contract.weekly_max_weeks', 3),
            'monthly_allowed_terms' => AppSetting::config('contract.monthly_allowed_terms', [3, 6, 12]),
            'prorata'               => AppSetting::config('billing.prorata', false),
            'release_day_of_month'  => AppSetting::config('billing.release_day_of_month', 1),
            'due_day_of_month'      => AppSetting::config('billing.due_day_of_month', 5),
        ];

        return Inertia::render('management/contract/create', [
            'options' => [
                'tenants'           => $tenants,
                'rooms'             => $rooms,
                'billing_periods'   => BillingPeriod::options(),
                'today_date'        => $today,
                'contract_settings' => $contractSettings,
            ],
        ]);
    }

    /** Export contracts as CSV using current filters. */
    public function export(Request $request)
    {
        $q = Contract::query()->with(['tenant:id,name', 'room:id,number,name']);

        $status = (string) $request->query('status', '');
        if ($status !== '') {
            $q->where('status', $status);
        }
        $start = $request->query('start');
        $end   = $request->query('end');
        if ($start) {
            try {
                $d = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $start)->toDateString();
                $q->whereDate('start_date', '>=', $d);
            } catch (\Throwable) {
                // ignore;
            }
        }
        if ($end) {
            try {
                $d = \Carbon\Carbon::createFromFormat('Y-m-d', (string) $end)->toDateString();
                $q->whereDate('start_date', '<=', $d);
            } catch (\Throwable) {
                // ignore;
            }
        }
        $q->orderByDesc('created_at')->orderByDesc('id');

        $filename = 'contracts_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($q): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Number', 'Start Date', 'End Date', 'Status', 'Rent (cents)', 'Auto Renew', 'Tenant', 'Room']);
            $q->chunk(1000, function ($rows) use ($out) {
                foreach ($rows as $c) {
                    /* @var Contract $c */
                    fputcsv($out, [
                        (string) ($c->number ?? ''),
                        $c->start_date->toDateString(),
                        $c->end_date?->toDateString(),
                        (string) $c->status->value,
                        (int) ($c->rent_idr ?? 0),
                        $c->auto_renew ? 'yes' : 'no',
                        $c->tenant?->name,
                        optional($c->room)->number ?? optional($c->room)->name,
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

    public function store(StoreContractRequest $request)
    {
        $data = $request->validated();
        // Map promo_code into promo options for ContractService
        $promoCode = trim((string) $request->input('promo_code', ''));
        if ($promoCode !== '') {
            $data['promo'] = [
                'channel'     => 'admin',
                'coupon_code' => $promoCode,
            ];
        }
        try {
            $contract = $this->contracts->create($data);
        } catch (\RuntimeException $e) {
            return back()
                ->withErrors(['room_id' => $e->getMessage()])
                ->withInput();
        }

        $this->logEvent(
            event: 'contract_created',
            causer: $request->user(),
            properties: [
                'user_id'        => $data['user_id'] ?? null,
                'room_id'        => $data['room_id'] ?? null,
                'start_date'     => $data['start_date'] ?? null,
                'end_date'       => $data['end_date'] ?? null,
                'billing_period' => $data['billing_period'] ?? null,
            ],
        );

        try {
            $tenantId = (int) ($data['user_id'] ?? 0);
            if ($tenantId > 0) {
                $title     = __('notifications.contract.created.title');
                $message   = __('notifications.contract.created.message');
                $actionUrl = null;
                $this->notifications->notifyUser($tenantId, $title, $message, $actionUrl, [
                    'scope'       => 'user',
                    'type'        => 'contract',
                    'event'       => 'created',
                    'contract_id' => (string) $contract->id,
                ]);
            }
        } catch (\Throwable) {
            // ignore;
        }

        return redirect()->route('management.contracts.index')->with('success', __('management/contracts.created'));
    }

    public function show(Contract $contract)
    {
        $contract->load([
            'tenant:id,name,email,phone',
            'room:id,number,name,price_overrides,deposit_overrides,room_type_id,building_id,floor_id',
            'room.type:id,name,prices,deposits',
            'room.building:id,name,code',
            'room.floor:id,level,building_id',
        ]);

        $tenant = $contract->tenant;
        $room   = $contract->room;

        $contractDTO = [
            'id'                  => (string) $contract->id,
            'number'              => (string) ($contract->number ?? ''),
            'start_date'          => $contract->start_date->toDateString(),
            'end_date'            => $contract->end_date?->toDateString(),
            'rent_idr'            => (int) $contract->rent_idr,
            'deposit_idr'         => (int) $contract->deposit_idr,
            'billing_period'      => $contract->billing_period->value,
            'billing_day'         => $contract->billing_day,
            'auto_renew'          => (bool) $contract->auto_renew,
            'status'              => $contract->status->value,
            'notes'               => $contract->notes,
            'paid_in_full_at'     => $contract->paid_in_full_at?->toDateTimeString(),
            'deposit_refund_idr'  => $contract->deposit_refund_idr,
            'deposit_refunded_at' => $contract->deposit_refunded_at?->toDateTimeString(),
            'created_at'          => $contract->created_at->toDateTimeString(),
            'updated_at'          => $contract->updated_at->toDateTimeString(),
        ];

        $tenantDTO = $tenant ? [
            'id'    => (string) $tenant->id,
            'name'  => $tenant->name,
            'email' => $tenant->email,
            'phone' => $tenant->phone,
        ] : null;

        $roomDTO = $room ? [
            'id'              => (string) $room->id,
            'number'          => $room->number,
            'name'            => $room->name,
                'price_idr'   => $room->effectivePriceCents(BillingPeriod::MONTHLY->value),
                'deposit_idr' => $room->effectiveDepositCents(BillingPeriod::MONTHLY->value),
            'type'            => $room->type ? [
                'id'          => (string) $room->type->id,
                'name'        => $room->type->name,
                'deposit_idr' => (int) (($room->type->deposits['monthly'] ?? 0)),
                'price_idr'   => (int) (($room->type->prices['monthly'] ?? 0)),
            ] : null,
            'building' => $room->building ? [
                'id'   => (string) $room->building->id,
                'name' => $room->building->name,
                'code' => $room->building->code,
            ] : null,
            'floor' => $room->floor ? [
                'id'    => (string) $room->floor->id,
                'level' => $room->floor->level,
            ] : null,
        ] : null;

        $invoices = $contract->invoices()
            ->select('id', 'number', 'status', 'due_date', 'period_start', 'period_end', 'amount_idr', 'paid_at')
            ->orderByDesc('created_at')
            ->paginate(10);

        $invoices = $invoices->through(function (\Illuminate\Database\Eloquent\Model $m): array {
            /** @var \App\Models\Invoice $i */
            $i = $m;

            return [
                'id'           => (string) $i->id,
                'number'       => $i->number,
                'status'       => $i->status->value,
                'due_date'     => $i->due_date->toDateString(),
                'period_start' => $i->period_start?->toDateString(),
                'period_end'   => $i->period_end?->toDateString(),
                'amount_idr'   => (int) $i->amount_idr,
                'paid_at'      => $i->paid_at?->toDateTimeString(),
            ];
        });

        $handoverSettings = [
            'min_photos_checkin'              => (int) AppSetting::config('handover.min_photos_checkin', 0),
            'min_photos_checkout'             => (int) AppSetting::config('handover.min_photos_checkout', 0),
            'require_tenant_ack_for_complete' => (bool) AppSetting::config('handover.require_tenant_ack_for_complete', false),
            'require_checkin_for_activate'    => (bool) AppSetting::config('handover.require_checkin_for_activate', true),
        ];

        return Inertia::render('management/contract/detail', [
            'contract' => $contractDTO,
            'tenant'   => $tenantDTO,
            'room'     => $roomDTO,
            'invoices' => [
                'data'         => $invoices->items(),
                'current_page' => $invoices->currentPage(),
                'per_page'     => $invoices->perPage(),
                'total'        => $invoices->total(),
            ],
            'handover' => $handoverSettings,
        ]);
    }

    public function cancel(ReasonRequest $request, Contract $contract)
    {
        if (!in_array($contract->status, [ContractStatus::PENDING_PAYMENT, ContractStatus::BOOKED], true)) {
            return back()->with('error', __('management/contracts.cancel.not_allowed'));
        }

        $hasPaidInvoice = $contract->invoices()
            ->where('status', InvoiceStatus::PAID->value)
            ->exists();

        $hasCompletedPayment = $contract->invoices()
            ->whereHas('payments', function ($q) {
                $q->where('status', PaymentStatus::COMPLETED->value);
            })
            ->exists();

        if ($hasPaidInvoice || $hasCompletedPayment) {
            return back()->with('error', __('management/contracts.cancel.not_allowed_due_payments'));
        }

        $data   = $request->validated();
        $reason = (string) ($data['reason'] ?? '');

        $this->contracts->cancel($contract);
        $contract->refresh();

        if ($contract->status === ContractStatus::CANCELLED) {
            $this->logEvent(
                event: 'contract_cancelled',
                causer: $request->user(),
                subject: $contract,
                properties: [
                    'reason' => $reason,
                ],
            );

            try {
                $tenantId = (int) ($contract->user_id ?? 0);
                if ($tenantId > 0) {
                    $title     = __('notifications.contract.cancelled.title');
                    $message   = __('notifications.contract.cancelled.message');
                    $actionUrl = null;
                    $this->notifications->notifyUser($tenantId, $title, $message, $actionUrl, [
                        'scope'       => 'user',
                        'type'        => 'contract',
                        'event'       => 'cancelled',
                        'contract_id' => (string) $contract->id,
                        'reason'      => $reason,
                    ]);
                }
            } catch (\Throwable) {
                // ignore;
            }

            return back()->with('success', __('management/contracts.cancelled'));
        }

        return back()->with('error', __('management/contracts.cancel.failed'));
    }

    public function setAutoRenew(SetAutoRenewRequest $request, Contract $contract)
    {
        $data    = $request->validated();
        $enabled = (bool) $data['auto_renew'];

        if (!$enabled && $contract->status !== ContractStatus::ACTIVE) {
            return back()->with('error', __('management/contracts.autorenew.only_active'));
        }

        $this->contracts->setAutoRenew($contract, $enabled);

        $this->logEvent(
            event: $enabled ? 'contract_auto_renew_started' : 'contract_auto_renew_stopped',
            causer: $request->user(),
            subject: $contract,
            properties: [
                'reason' => $enabled ? null : (string) ($data['reason'] ?? ''),
            ],
        );

        try {
            $tenantId = (int) ($contract->user_id ?? 0);
            if ($tenantId > 0) {
                $title     = $enabled ? __('notifications.contract.autorenew.enabled.title') : __('notifications.contract.autorenew.disabled.title');
                $message   = $enabled ? __('notifications.contract.autorenew.enabled.message') : __('notifications.contract.autorenew.disabled.message');
                $actionUrl = null;
                $this->notifications->notifyUser($tenantId, $title, $message, $actionUrl, [
                    'scope'       => 'user',
                    'type'        => 'contract',
                    'event'       => $enabled ? 'autorenew_enabled' : 'autorenew_disabled',
                    'contract_id' => (string) $contract->id,
                    'reason'      => $enabled ? null : (string) ($data['reason'] ?? ''),
                ]);
            }
        } catch (\Throwable) {
        }

        return back()->with('success', $enabled ? __('management/contracts.autorenew.enabled') : __('management/contracts.autorenew.disabled'));
    }

    public function print(Contract $contract)
    {
        $contract->load([
            'tenant:id,name,email,phone',
            'room:id,number,name,price_overrides,building_id,floor_id,room_type_id',
            'room.building:id,name,code',
            'room.floor:id,level',
            'room.type:id,name,prices',
        ]);

        $tenant = $contract->tenant;
        $room   = $contract->room;

        $dto = [
            'number'         => (string) ($contract->number ?? ''),
            'status'         => (string) $contract->status->value,
            'start_date'     => $contract->start_date->toDateString(),
            'end_date'       => $contract->end_date?->toDateString(),
            'billing_period' => (string) $contract->billing_period->value,
            'billing_day'    => $contract->billing_day,
            'rent_idr'       => (int) $contract->rent_idr,
            'deposit_idr'    => (int) $contract->deposit_idr,
            'notes'          => (string) ($contract->notes ?? ''),
            'tenant'         => $tenant ? [
                'name'  => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
            ] : null,
            'room' => $room ? [
                'number'   => $room->number,
                'name'     => $room->name,
                'building' => $room->building?->name,
                'floor'    => $room->floor?->level,
                'type'     => $room->type?->name,
            ] : null,
        ];

        $html = view('pdf.contract', [
            'contract'  => $dto,
            'autoPrint' => false,
        ])->render();

        if (class_exists(Pdf::class)) {
            try {
                /** @var \Barryvdh\DomPDF\PDF $pdf */
                $pdf   = Pdf::loadHTML($html);
                $fname = ($contract->number ?: (string) $contract->id) . '.pdf';

                return $pdf->stream('Contract-' . $fname);
            } catch (\Throwable $e) {
                // fallback to HTML
            }
        }

        return response($html);
    }
}
