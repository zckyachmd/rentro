<?php

namespace App\Http\Controllers\Tenant;

use App\Enum\ContractStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StopAutoRenewRequest;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\RoomHandover;
use App\Traits\DataTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContractController extends Controller
{
    use DataTable;

    public function index(Request $request)
    {
        $query = Contract::query()
            ->where('user_id', $request->user()->id)
            ->with(['room:id,number'])
            ->select(['id', 'number', 'user_id', 'room_id', 'start_date', 'end_date', 'rent_cents', 'status', 'auto_renew']);

        $options = [
            'search_param' => 'q',
            'searchable'   => [
                'number',
                ['relation' => 'room', 'column' => 'number'],
            ],
            'sortable' => [
                'start_date' => 'start_date',
                'end_date'   => 'end_date',
                'rent_cents' => 'rent_cents',
                'status'     => 'status',
            ],
            'default_sort' => ['start_date', 'desc'],
            'filters'      => [
                'status' => function ($q, $status): void {
                    $q->where('status', $status);
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<Contract> $page */
        $page = $this->applyTable($query, $request, $options);

        $ids               = $page->getCollection()->pluck('id');
        $pendingCheckinIds = RoomHandover::query()
            ->whereIn('contract_id', $ids)
            ->where('type', 'checkin')
            ->where('status', 'Pending')
            ->pluck('contract_id')
            ->unique();
        $pendingCheckoutIds = RoomHandover::query()
            ->whereIn('contract_id', $ids)
            ->where('type', 'checkout')
            ->where('status', 'Pending')
            ->pluck('contract_id')
            ->unique();

        $mapped = $page->getCollection()->map(function (Contract $c) use ($pendingCheckinIds, $pendingCheckoutIds): array {
            $room = $c->room;

            return [
                'id'                 => (string) $c->id,
                'number'             => (string) ($c->number ?? ''),
                'room'               => $room ? ['id' => (string) $room->id, 'number' => (string) $room->number] : null,
                'start_date'         => $c->start_date ? $c->start_date->toDateString() : null,
                'end_date'           => $c->end_date ? $c->end_date->toDateString() : null,
                'rent_cents'         => (int) $c->rent_cents,
                'status'             => (string) $c->status->value,
                'auto_renew'         => (bool) $c->auto_renew,
                'needs_ack_checkin'  => $pendingCheckinIds->contains($c->id),
                'needs_ack_checkout' => $pendingCheckoutIds->contains($c->id),
            ];
        });
        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        $forfeitDays = AppSetting::config('contract.stop_auto_renew_forfeit_days', 7);

        return Inertia::render('tenant/contract/index', [
            'contracts' => $payload,
            'query'     => [
                'page'     => $payload['current_page'],
                'per_page' => $payload['per_page'],
                'sort'     => $request->query('sort'),
                'dir'      => $request->query('dir'),
                'q'        => $request->query('q'),
                'status'   => $request->query('status'),
            ],
            'options' => [
                'statuses'     => ContractStatus::options(),
                'forfeit_days' => (int) $forfeitDays,
            ],
        ]);
    }

    public function show(Request $request, Contract $contract)
    {
        if ((string) $contract->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        $contract->load([
            'room:id,number,name,building_id,floor_id,room_type_id,price_overrides',
            'room.building:id,name,code',
            'room.floor:id,level',
            'room.type:id,name,prices',
        ]);

        // Invoices for this contract (tenant POV)
        $invPage = $contract->invoices()
            ->select(['id', 'number', 'period_start', 'period_end', 'due_date', 'amount_cents', 'status', 'paid_at'])
            ->orderByDesc('due_date')
            ->paginate(20)
            ->through(function (\Illuminate\Database\Eloquent\Model $m): array {
                /** @var \App\Models\Invoice $inv */
                $inv = $m;

                return [
                    'id'           => (string) $inv->id,
                    'number'       => (string) $inv->number,
                    'period_start' => $inv->period_start ? $inv->period_start->toDateString() : null,
                    'period_end'   => $inv->period_end ? $inv->period_end->toDateString() : null,
                    // keep non-null string for due_date to satisfy static types
                    'due_date'     => $inv->due_date ? $inv->due_date->toDateString() : '',
                    'amount_cents' => (int) $inv->amount_cents,
                    'status'       => (string) $inv->status->value,
                    'paid_at'      => $inv->paid_at ? $inv->paid_at->toDateTimeString() : null,
                ];
            });

        $r = $contract->room;

        return Inertia::render('tenant/contract/detail', [
            'contract' => [
                'id'         => (string) $contract->id,
                'number'     => (string) ($contract->number ?? ''),
                'updated_at' => $contract->updated_at?->toDateTimeString(),
                'room'       => $r ? [
                    'id'          => (string) $r->id,
                    'number'      => (string) $r->number,
                    'name'        => (string) ($r->name ?? ''),
                    'price_cents' => (int) ($r->effectivePriceCents('Monthly') ?? 0),
                    'building'    => $r->building ? [
                        'id'   => (string) $r->building->id,
                        'name' => (string) ($r->building->name ?? ''),
                        'code' => (string) ($r->building->code ?? ''),
                    ] : null,
                    'floor' => $r->floor ? [
                        'id'    => (string) $r->floor->id,
                        'level' => (string) $r->floor->level,
                    ] : null,
                    'type' => $r->type ? [
                        'id'          => (string) $r->type->id,
                        'name'        => (string) ($r->type->name ?? ''),
                        'price_cents' => (int) (($r->type->prices['monthly'] ?? 0)),
                    ] : null,
                ] : null,
                'start_date'     => $contract->start_date ? $contract->start_date->toDateString() : null,
                'end_date'       => $contract->end_date ? $contract->end_date->toDateString() : null,
                'rent_cents'     => (int) $contract->rent_cents,
                'deposit_cents'  => (int) ($contract->deposit_cents ?? 0),
                'billing_period' => (string) ($contract->billing_period ? $contract->billing_period->value : ''),
                'billing_day'    => $contract->billing_day,
                'status'         => (string) $contract->status->value,
                'auto_renew'     => (bool) $contract->auto_renew,
                'notes'          => (string) ($contract->notes ?? ''),
            ],
            'invoices' => [
                'data'         => $invPage->items(),
                'current_page' => $invPage->currentPage(),
                'per_page'     => $invPage->perPage(),
                'total'        => $invPage->total(),
            ],
        ]);
    }

    public function print(Request $request, Contract $contract)
    {
        if ((string) $contract->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        $contract->load([
            'room:id,number,name,building_id,floor_id,room_type_id,price_overrides',
            'room.building:id,name,code',
            'room.floor:id,level',
            'room.type:id,name,prices',
        ]);

        $r        = $contract->room;
        $building = $r?->building;
        $floor    = $r?->floor;
        $type     = $r?->type;

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
            'tenant'         => [
                'name'  => $request->user()->name,
                'email' => $request->user()->email,
                'phone' => $request->user()->phone,
            ],
            'room' => $r ? [
                'number'   => $r->number,
                'name'     => $r->name,
                'building' => $building?->name,
                'floor'    => $floor?->level,
                'type'     => $type?->name,
            ] : null,
        ];

        $html = view('pdf.contract', [
            'contract'  => $dto,
            'autoPrint' => false,
        ])->render();

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            try {
                /** @var \Barryvdh\DomPDF\PDF $pdf */
                $pdf   = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
                $fname = ($contract->number ?: (string) $contract->id) . '.pdf';

                return $pdf->stream('Contract-' . $fname);
            } catch (\Throwable $e) {
                // fallback to HTML
            }
        }

        return response($html);
    }

    /**
     * Tenant stops auto-renew for their own contract (set auto_renew=false).
     */
    public function stopAutoRenew(StopAutoRenewRequest $request, Contract $contract)
    {
        if (!$contract->auto_renew) {
            return back()->with('success', 'Perpanjangan otomatis sudah nonaktif.');
        }

        if ($contract->status !== ContractStatus::ACTIVE) {
            return back()->with('error', 'Hanya kontrak berstatus Active yang dapat menghentikan perpanjangan otomatis.');
        }

        $request->validated();

        $forfeitDays = (int) (AppSetting::config('contract.stop_auto_renew_forfeit_days', 7) ?? 7);
        $today       = now()->startOfDay();
        $endDate     = $contract->end_date?->copy()->startOfDay();
        $daysLeft    = $endDate ? max(0, $today->diffInDays($endDate, false)) : null;

        $contract->forceFill(['auto_renew' => false, 'renewal_cancelled_at' => now()])->save();

        if ($daysLeft !== null && $daysLeft < $forfeitDays) {
            return back()->with('success', "Perpanjangan otomatis dihentikan. Sesuai kebijakan, deposit akan hangus karena kurang dari {$forfeitDays} hari dari tanggal berakhir.");
        }

        return back()->with('success', 'Perpanjangan otomatis telah dihentikan.');
    }
}
