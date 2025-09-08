<?php

namespace App\Http\Controllers\Tenant;

use App\Enum\ContractStatus;
use App\Http\Controllers\Controller;
use App\Models\Contract;
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
            ->select(['id', 'user_id', 'room_id', 'start_date', 'end_date', 'rent_cents', 'status', 'auto_renew']);

        $options = [
            'search_param' => 'q',
            'searchable'   => [
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

        $mapped = $page->getCollection()->map(function (Contract $c): array {
            /** @var \App\Models\Room|null $room */
            $room = $c->room;

            return [
                'id'         => (string) $c->id,
                'room'       => $room ? ['id' => (string) $room->id, 'number' => (string) $room->number] : null,
                'start_date' => $c->start_date ? $c->start_date->toDateString() : null,
                'end_date'   => $c->end_date ? $c->end_date->toDateString() : null,
                'rent_cents' => (int) $c->rent_cents,
                'status'     => (string) $c->status->value,
                'auto_renew' => (bool) $c->auto_renew,
            ];
        });
        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

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
                'statuses' => ContractStatus::options(),
            ],
        ]);
    }

    public function show(Request $request, Contract $contract)
    {
        if ((string) $contract->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        $contract->load([
            'room:id,number,name,building_id,floor_id,room_type_id,price_cents,billing_period',
            'room.building:id,name,code',
            'room.floor:id,level',
            'room.type:id,name,price_cents',
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

        /** @var \App\Models\Room|null $r */
        $r = $contract->room;

        return Inertia::render('tenant/contract/detail', [
            'contract' => [
                'id'         => (string) $contract->id,
                'updated_at' => $contract->updated_at?->toDateTimeString(),
                'room'       => $r ? [
                    'id'             => (string) $r->id,
                    'number'         => (string) $r->number,
                    'name'           => (string) ($r->name ?? ''),
                    'price_cents'    => (int) ($r->price_cents ?? 0),
                    'billing_period' => (string) ($r->billing_period ? $r->billing_period->value : ''),
                    'building'       => $r->building ? [
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
                        'price_cents' => (int) ($r->type->price_cents ?? 0),
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

    /**
     * Tenant stops auto-renew for their own contract (set auto_renew=false).
     */
    public function stopAutoRenew(Request $request, Contract $contract)
    {
        if ((string) $contract->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        if (!$contract->auto_renew) {
            return back()->with('info', 'Perpanjangan otomatis sudah nonaktif.');
        }

        $contract->forceFill(['auto_renew' => false, 'renewal_cancelled_at' => now()])->save();

        return back()->with('success', 'Perpanjangan otomatis telah dihentikan.');
    }
}
