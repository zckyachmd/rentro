<?php

namespace App\Http\Controllers\Management;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\RoleName;
use App\Enum\RoomStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Contract\StoreContractRequest;
use App\Http\Requests\Management\Contract\UpdateContractRequest;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Room;
use App\Models\User;
use App\Services\Contracts\ContractServiceInterface;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
            ],
            'default_sort' => ['start_date', 'desc'],
            'filters'      => [
                'status' => fn ($q, $v) => $q->where('status', $v),
                'q'      => function ($q, $v) {
                    $term = trim((string) $v);
                    if ($term === '') {
                        return;
                    }
                    $like = $this->tableLikeOperator();
                    $q->where(function ($qq) use ($term, $like) {
                        $qq->orWhere('notes', $like, "%{$term}%")
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

        $collection = $page->getCollection();
        $mapped     = $collection->map(function (Contract $c): array {
            /** @var \App\Models\User|null $tenant */
            $tenant = $c->tenant;
            /** @var \App\Models\Room|null $room */
            $room = $c->room;

            return [
                'id'         => (string) $c->id,
                'tenant'     => $tenant ? ['id' => $tenant->id, 'name' => $tenant->name, 'email' => $tenant->email] : null,
                'room'       => $room ? ['id' => (string) $room->id, 'number' => $room->number] : null,
                'start_date' => $c->start_date->format('Y-m-d'),
                'end_date'   => $c->end_date?->format('Y-m-d'),
                'rent_cents' => (int) $c->rent_cents,
                'status'     => $c->status->value,
                'auto_renew' => (bool) $c->auto_renew,
            ];
        });
        $page->setCollection($mapped);

        $contractsPayload = $this->tablePaginate($page);

        return Inertia::render('management/contract/index', [
            'contracts' => $contractsPayload,
            'options'   => [
                'statuses' => ContractStatus::options(),
            ],
            'query' => [
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

        $rooms = Room::query()
            ->select('id', 'number', 'name', 'price_cents', 'billing_period', 'room_type_id', 'building_id', 'floor_id', 'status')
            ->where('status', RoomStatus::VACANT->value)
            ->with([
                'type:id,deposit_cents,price_cents',
                'building:id,name,code',
                'floor:id,level,building_id',
            ])
            ->orderBy('number')
            ->get()
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
        $this->contracts->create($data);

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

    public function update(UpdateContractRequest $request, Contract $contract)
    {
        $data = $request->validated();
        $contract->update($data);

        $this->logModel('contract_updated', $contract, [
            'id' => (string) $contract->id,
        ]);

        return back()->with('success', 'Kontrak berhasil diperbarui.');
    }

    public function destroy(Contract $contract)
    {
        $snapshot = $contract->only(['id', 'user_id', 'room_id', 'start_date', 'end_date', 'status']);
        $contract->delete();

        $this->logEvent(
            event: 'contract_deleted',
            causer: request()->user(),
            subject: $contract,
            properties: $snapshot,
        );

        return back()->with('success', 'Kontrak berhasil dihapus.');
    }

    public function cancel(Request $request, Contract $contract)
    {
        if (in_array($contract->status->value, [ContractStatus::CANCELLED->value, ContractStatus::COMPLETED->value], true)) {
            return back()->with('error', 'Kontrak sudah tidak aktif.');
        }

        $this->contracts->cancel($contract);

        $this->logEvent(
            event: 'contract_cancelled',
            causer: $request->user(),
            subject: $contract,
        );

        return back()->with('success', 'Kontrak dibatalkan.');
    }

    public function extendDue(Request $request, Contract $contract)
    {
        $data = $request->validate([
            'due_date' => ['required', 'date', 'after:today'],
        ]);

        /** @var \App\Models\Invoice|null $invoice */
        $invoice = $contract->invoices()
            ->where('status', InvoiceStatus::PENDING->value)
            ->orderByDesc('due_date')
            ->first();

        if (!$invoice) {
            return back()->with('error', 'Tidak ada invoice pending untuk diperpanjang.');
        }

        $invoice->due_date = Carbon::parse($data['due_date'])->startOfDay();
        $invoice->save();

        $today = Carbon::now()->startOfDay();
        if ($invoice->due_date && $invoice->due_date->greaterThanOrEqualTo($today)) {
            $contract->status = ContractStatus::PENDING_PAYMENT;
            $contract->save();
            if ($contract->room) {
                $contract->room->update(['status' => RoomStatus::RESERVED->value]);
            }
        }

        /* @var \App\Models\Invoice $invoice */
        $this->logEvent(
            event: 'contract_due_extended',
            causer: $request->user(),
            subject: $contract,
            properties: [
                'invoice_id' => $invoice->id,
                'due_date'   => $invoice->due_date ? $invoice->due_date->toDateString() : null,
            ],
        );

        return back()->with('success', 'Masa tenggat berhasil diperpanjang.');
    }

    public function stopAutoRenew(Request $request, Contract $contract)
    {
        if (!$contract->auto_renew) {
            return back()->with('success', 'Auto‑renew sudah nonaktif.');
        }

        $contract->auto_renew           = false;
        $contract->renewal_cancelled_at = now();
        $contract->save();

        $this->logEvent(
            event: 'contract_auto_renew_stopped',
            causer: $request->user(),
            subject: $contract,
        );

        return back()->with('success', 'Auto‑renew dihentikan.');
    }

    public function startAutoRenew(Request $request, Contract $contract)
    {
        if ($contract->auto_renew) {
            return back()->with('success', 'Auto‑renew sudah aktif.');
        }

        $contract->auto_renew           = true;
        $contract->renewal_cancelled_at = null;
        $contract->save();

        $this->logEvent(
            event: 'contract_auto_renew_started',
            causer: $request->user(),
            subject: $contract,
        );

        return back()->with('success', 'Auto‑renew dinyalakan.');
    }
}
