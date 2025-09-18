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
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContractManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function __construct(private ContractServiceInterface $contracts)
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
                'rent_cents',
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
                'rent'       => 'rent_cents',
                'status'     => 'status',
                'created_at' => 'created_at',
            ],
            'default_sort' => ['created_at', 'desc'],
            'filters'      => [
                'status' => fn ($q, $v) => $q->where('status', $v),
                'q'      => function ($q, $v) {
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
            ->where('type', 'checkin')
            ->where('status', 'Confirmed')
            ->pluck('contract_id')
            ->unique()
            ->flip();

        $confirmedCheckoutIds = RoomHandover::query()
            ->select('contract_id')
            ->whereIn('contract_id', $contractIds)
            ->where('type', 'checkout')
            ->where('status', 'Confirmed')
            ->pluck('contract_id')
            ->unique()
            ->flip();

        $latestCheckinByContract = RoomHandover::query()
            ->whereIn('contract_id', $contractIds)
            ->where('type', 'checkin')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['contract_id', 'status'])
            ->unique('contract_id')
            ->keyBy('contract_id');

        $latestCheckoutByContract = RoomHandover::query()
            ->whereIn('contract_id', $contractIds)
            ->where('type', 'checkout')
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
                'id'                     => (string) $c->id,
                'number'                 => (string) ($c->number ?? ''),
                'tenant'                 => $tenant ? ['id' => $tenant->id, 'name' => $tenant->name, 'email' => $tenant->email] : null,
                'room'                   => $room ? ['id' => (string) $room->id, 'number' => $room->number] : null,
                'start_date'             => $c->start_date->format('Y-m-d'),
                'end_date'               => $c->end_date?->format('Y-m-d'),
                'rent_cents'             => (int) $c->rent_cents,
                'status'                 => $c->status->value,
                'auto_renew'             => (bool) $c->auto_renew,
                'has_checkin'            => (bool) $hasConfirmedCheckin,
                'has_checkout'           => (bool) $hasConfirmedCheckout,
                'latest_checkin_status'  => $latestCheckinStatus,
                'latest_checkout_status' => $latestCheckoutStatus,
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

        return Inertia::render('management/contract/index', [
            'contracts' => $contractsPayload,
            'options'   => [
                'statuses' => ContractStatus::options(),
            ],
            'handover' => $handoverSettings,
            'query'    => [
                'page'    => $contractsPayload['current_page'],
                'perPage' => $contractsPayload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'status'  => $request->query('status'),
                'q'       => $request->query('q'),
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
            ->select('id', 'number', 'name', 'price_cents', 'billing_period', 'room_type_id', 'building_id', 'floor_id', 'status')
            ->where('status', RoomStatus::VACANT->value)
            ->with([
                'type:id,deposit_cents,price_cents',
                'building:id,name,code',
                'floor:id,level,building_id',
            ])
            ->orderBy('number')
            ->get();

        $prebookRooms = Room::query()
            ->select('id', 'number', 'name', 'price_cents', 'billing_period', 'room_type_id', 'building_id', 'floor_id', 'status')
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
                'type:id,deposit_cents,price_cents',
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
                    'id'               => (string) $r->id,
                    'number'           => $r->number,
                    'name'             => $r->name,
                    'price_cents'      => $r->price_cents,
                    'billing_period'   => $r->billing_period->value,
                    'deposit_cents'    => $r->type?->deposit_cents,
                    'type_price_cents' => $r->type?->price_cents,
                    'building'         => $r->building ? [
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

    public function store(StoreContractRequest $request)
    {
        $data = $request->validated();
        try {
            $this->contracts->create($data);
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

        return redirect()->route('management.contracts.index')->with('success', 'Kontrak berhasil dibuat.');
    }

    public function show(Contract $contract)
    {
        $contract->load([
            'tenant:id,name,email,phone',
            'room:id,number,name,billing_period,price_cents,room_type_id,building_id,floor_id',
            'room.type:id,name,deposit_cents,price_cents',
            'room.building:id,name,code',
            'room.floor:id,level,building_id',
        ]);

        $tenant = $contract->tenant;
        $room   = $contract->room;

        $contractDTO = [
            'id'                   => (string) $contract->id,
            'number'               => (string) ($contract->number ?? ''),
            'start_date'           => $contract->start_date->toDateString(),
            'end_date'             => $contract->end_date?->toDateString(),
            'rent_cents'           => (int) $contract->rent_cents,
            'deposit_cents'        => (int) $contract->deposit_cents,
            'billing_period'       => $contract->billing_period->value,
            'billing_day'          => $contract->billing_day,
            'auto_renew'           => (bool) $contract->auto_renew,
            'status'               => $contract->status->value,
            'notes'                => $contract->notes,
            'paid_in_full_at'      => $contract->paid_in_full_at?->toDateTimeString(),
            'deposit_refund_cents' => $contract->deposit_refund_cents,
            'deposit_refunded_at'  => $contract->deposit_refunded_at?->toDateTimeString(),
            'created_at'           => $contract->created_at->toDateTimeString(),
            'updated_at'           => $contract->updated_at->toDateTimeString(),
        ];

        $tenantDTO = $tenant ? [
            'id'    => (string) $tenant->id,
            'name'  => $tenant->name,
            'email' => $tenant->email,
            'phone' => $tenant->phone,
        ] : null;

        $roomDTO = $room ? [
            'id'             => (string) $room->id,
            'number'         => $room->number,
            'name'           => $room->name,
            'billing_period' => $room->billing_period->value,
            'price_cents'    => $room->price_cents,
            'type'           => $room->type ? [
                'id'            => (string) $room->type->id,
                'name'          => $room->type->name,
                'deposit_cents' => $room->type->deposit_cents,
                'price_cents'   => $room->type->price_cents,
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
            ->select('id', 'number', 'status', 'due_date', 'period_start', 'period_end', 'amount_cents', 'paid_at')
            ->orderByDesc('created_at')
            ->paginate(10);

        $invoices = $invoices->through(function (Model $m, int $index): array {
            $i = $m;

            return [
                'id'           => (string) $i->id,
                'number'       => $i->number,
                'status'       => $i->status->value,
                'due_date'     => $i->due_date->toDateString(),
                'period_start' => $i->period_start?->toDateString(),
                'period_end'   => $i->period_end?->toDateString(),
                'amount_cents' => (int) $i->amount_cents,
                'paid_at'      => $i->paid_at?->toDateTimeString(),
            ];
        });

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
        ]);
    }

    public function cancel(ReasonRequest $request, Contract $contract)
    {
        if (!in_array($contract->status, [ContractStatus::PENDING_PAYMENT, ContractStatus::BOOKED], true)) {
            return back()->with('error', 'Kontrak tidak dapat dibatalkan. Hanya kontrak Pending Payment atau Booked yang dapat dibatalkan.');
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
            return back()->with('error', 'Kontrak tidak dapat dibatalkan karena terdapat pembayaran yang sudah selesai atau invoice yang sudah lunas.');
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

            return back()->with('success', 'Kontrak dibatalkan.');
        }

        return back()->with('error', 'Kontrak tidak dapat dibatalkan.');
    }

    public function setAutoRenew(SetAutoRenewRequest $request, Contract $contract)
    {
        $data    = $request->validated();
        $enabled = (bool) $data['auto_renew'];

        if (!$enabled && $contract->status !== ContractStatus::ACTIVE) {
            return back()->with('error', 'Hanya kontrak berstatus Active yang dapat menghentikan perpanjangan otomatis.');
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

        return back()->with('success', $enabled ? 'Auto‑renew dinyalakan.' : 'Auto‑renew dihentikan.');
    }

    public function print(Contract $contract)
    {
        $contract->load([
            'tenant:id,name,email,phone',
            'room:id,number,name,billing_period,price_cents,building_id,floor_id,room_type_id',
            'room.building:id,name,code',
            'room.floor:id,level',
            'room.type:id,name,price_cents',
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
            'rent_cents'     => (int) $contract->rent_cents,
            'deposit_cents'  => (int) $contract->deposit_cents,
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
