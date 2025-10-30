<?php

namespace App\Http\Controllers\Management;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\ReasonRequest;
use App\Http\Requests\Management\Invoice\ExtendDueRequest;
use App\Http\Requests\Management\Invoice\GenerateInvoiceRequest;
use App\Http\Requests\Management\Invoice\LookupRequest;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\User;
use App\Services\Contracts\InvoiceServiceInterface;
use App\Services\NotificationService;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function __construct(private InvoiceServiceInterface $invoices, private NotificationService $notifications)
    {
    }

    public function index(Request $request)
    {
        $query = Invoice::query()
            ->with([
                'contract:id,user_id,room_id',
                'contract.tenant:id,name,email',
                'contract.room:id,number',
            ]);

        $options = [
            'search_param' => 'search',
            'searchable'   => [
                'number',
                'contract.tenant.name',
                'contract.room.number',
                function ($q, string $term) {
                    if (preg_match('/^contract:(\d+)$/i', trim($term), $m)) {
                        $q->orWhere('contract_id', (int) $m[1]);
                    }
                },
            ],
            'sortable' => [
                'number'     => 'number',
                'due_date'   => 'due_date',
                'amount_idr' => 'amount_idr',
                'status'     => 'status',
            ],
            'default_sort' => ['due_date', 'desc'],
            'filters'      => [
                'status' => function ($q, $status) {
                    $q->where('status', $status);
                },
                'start' => function ($q, $start) {
                    try {
                        $d = Carbon::createFromFormat('Y-m-d', (string) $start)->toDateString();
                    } catch (\Throwable) {
                        return;
                    }
                    $q->whereDate('due_date', '>=', $d);
                },
                'end' => function ($q, $end) {
                    try {
                        $d = Carbon::createFromFormat('Y-m-d', (string) $end)->toDateString();
                    } catch (\Throwable) {
                        return;
                    }
                    $q->whereDate('due_date', '<=', $d);
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\App\Models\Invoice> $page */
        $page = $this->applyTable($query, $request, $options);

        $mapped = $page->getCollection()->map(function (Invoice $inv) {
            $contract = $inv->contract;
            $tenant   = $contract?->tenant;
            $room     = $contract?->room;

            $outstanding = (int) ($inv->outstanding_idr ?? 0);

            return [
                'id'           => (string) $inv->id,
                'number'       => $inv->number,
                'due_date'     => $inv->due_date->format('Y-m-d'),
                'amount_idr'   => (int) $inv->amount_idr,
                'status'       => $inv->status->value,
                'tenant'       => $tenant?->name,
                'tenant_email' => $tenant?->email,
                'room_number'  => $room?->number,
                'outstanding'  => $outstanding,
            ];
        });
        $page->setCollection($mapped);
        $invoicesPayload = $this->tablePaginate($page);

        $contracts = Contract::query()
            ->select('id', 'user_id', 'status', 'billing_period', 'start_date', 'end_date')
            ->with(['tenant:id,name'])
            ->whereNotIn('status', [ContractStatus::CANCELLED->value, ContractStatus::COMPLETED->value])
            ->whereNull('paid_in_full_at')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function (Contract $c) {
                /** @var User|null $t */
                $t = $c->tenant;

                return [
                    'id'         => (string) $c->id,
                    'name'       => $t?->name ? ($t->name . ' — #' . $c->id) : ('#' . $c->id),
                    'period'     => (string) $c->billing_period->value,
                    'start_date' => $c->start_date->toDateString(),
                    'end_date'   => $c->end_date->toDateString(),
                ];
            });

        $statusOptions = collect(InvoiceStatus::cases())->map(fn ($s) => $s->value);

        // Summary for header (respect filters)
        $sumBase = Invoice::query();
        $this->applyRequestFilters($sumBase, $request);
        $countAll       = (int) $sumBase->count('id');
        $countPending   = (int) (clone $sumBase)->where('status', InvoiceStatus::PENDING->value)->count('id');
        $countOverdue   = (int) (clone $sumBase)->where('status', InvoiceStatus::OVERDUE->value)->count('id');
        $countPaid      = (int) (clone $sumBase)->where('status', InvoiceStatus::PAID->value)->count('id');
        $sumAmount      = (int) (clone $sumBase)->sum('amount_idr');
        $sumOutstanding = (int) (clone $sumBase)
            ->whereIn('status', [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value])
            ->sum('outstanding_idr');

        return Inertia::render('management/invoice/index', [
            'invoices' => $invoicesPayload,
            'options'  => [
                'statuses'  => $statusOptions,
                'contracts' => $contracts,
            ],
            'summary' => [
                'count'           => $countAll,
                'count_pending'   => $countPending,
                'count_overdue'   => $countOverdue,
                'count_paid'      => $countPaid,
                'sum_amount'      => $sumAmount,
                'sum_outstanding' => $sumOutstanding,
            ],
            'query' => [
                'page'    => $invoicesPayload['current_page'],
                'perPage' => $invoicesPayload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
                'status'  => $request->query('status'),
                'start'   => $request->query('start'),
                'end'     => $request->query('end'),
            ],
        ]);
    }

    /** Export invoices as CSV using current filters. */
    public function export(Request $request)
    {
        $q = Invoice::query()->with([
            'contract:id,user_id,room_id,number',
            'contract.tenant:id,name',
            'contract.room:id,number,name',
        ]);
        $this->applyRequestFilters($q, $request);
        $q->orderByDesc('due_date')->orderByDesc('id');

        $filename = 'invoices_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($q): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Number', 'Due Date', 'Status', 'Amount (cents)', 'Outstanding (cents)', 'Tenant', 'Room']);
            $q->chunk(1000, function ($rows) use ($out) {
                foreach ($rows as $inv) {
                    /** @var Invoice $inv */
                    $c = $inv->contract;
                    fputcsv($out, [
                        $inv->number,
                        $inv->due_date->toDateString(),
                        (string) $inv->status->value,
                        (int) $inv->amount_idr,
                        (int) ($inv->outstanding_idr ?? 0),
                        $c?->tenant?->name,
                        optional($c?->room)->number ?? optional($c?->room)->name,
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

    protected function applyRequestFilters(\Illuminate\Database\Eloquent\Builder $q, Request $request): void
    {
        $status = (string) $request->query('status', '');
        if ($status !== '') {
            $q->where('status', $status);
        }
        $start = $request->query('start');
        $end   = $request->query('end');
        if ($start) {
            try {
                $d = Carbon::createFromFormat('Y-m-d', (string) $start)->toDateString();
                $q->whereDate('due_date', '>=', $d);
            } catch (\Throwable) {
            }
        }
        if ($end) {
            try {
                $d = Carbon::createFromFormat('Y-m-d', (string) $end)->toDateString();
                $q->whereDate('due_date', '<=', $d);
            } catch (\Throwable) {
            }
        }
    }

    public function show(Request $request, Invoice $invoice)
    {
        $invoice->load([
            'contract:id,user_id,room_id,number,billing_period,start_date,end_date',
            'contract.tenant:id,name,email,phone',
            'contract.room:id,number,name',
            'payments:id,invoice_id,method,status,amount_idr,paid_at,reference,provider',
        ]);

        $c      = $invoice->contract;
        $tenant = $c?->tenant;
        $room   = $c?->room;

        $dto = [
            'id'           => (string) $invoice->id,
            'number'       => $invoice->number,
            'status'       => $invoice->status->value,
            'due_date'     => $invoice->due_date->toDateString(),
            'period_start' => $invoice->period_start->toDateString(),
            'period_end'   => $invoice->period_end->toDateString(),
            'amount_idr'   => (int) $invoice->amount_idr,
            'items'        => (array) ($invoice->items ?? []),
            'paid_at'      => $invoice->paid_at?->toDateTimeString(),
            'created_at'   => $invoice->created_at->toDateTimeString(),
            'updated_at'   => $invoice->updated_at->toDateTimeString(),
            'release_day'  => (int) AppSetting::config('billing.release_day_of_month', 1),
        ];

        $contractDTO = $c ? [
            'id'             => (string) $c->id,
            'number'         => (string) ($c->number ?? ''),
            'billing_period' => $c->billing_period->value,
            'start_date'     => $c->start_date->toDateString(),
            'end_date'       => $c->end_date->toDateString(),
        ] : null;
        $tenantDTO = $tenant ? [
            'id'    => (string) $tenant->id,
            'name'  => $tenant->name,
            'email' => $tenant->email,
            'phone' => $tenant->phone,
        ] : null;
        $roomDTO = $room ? [
            'id'     => (string) $room->id,
            'number' => $room->number,
            'name'   => $room->name,
        ] : null;

        $paymentsCollection = $invoice->payments;
        $payments           = $paymentsCollection
            ->sortBy(function (\App\Models\Payment $p) {
                return ($p->paid_at?->getTimestamp() ?? 0) ?: ($p->created_at?->getTimestamp() ?? 0);
            })
            ->values()
            ->map(function (\App\Models\Payment $p) {
                return [
                    'id'         => (string) $p->id,
                    'method'     => (string) $p->method->value,
                    'status'     => (string) $p->status->value,
                    'amount_idr' => (int) $p->amount_idr,
                    'paid_at'    => $p->paid_at?->toDateTimeString(),
                    'reference'  => $p->reference,
                    'provider'   => $p->provider,
                ];
            });

        $totals       = $this->invoices->totals($invoice);
        $totalInvoice = (int) $totals['total_invoice'];
        $totalPaid    = (int) $totals['total_paid'];
        $outstanding  = (int) ($invoice->outstanding_idr ?? $totals['outstanding']);

        return response()->json([
            'invoice'         => $dto,
            'contract'        => $contractDTO,
            'tenant'          => $tenantDTO,
            'room'            => $roomDTO,
            'payments'        => $payments,
            'payment_summary' => [
                'total_invoice' => $totalInvoice,
                'total_paid'    => $totalPaid,
                'outstanding'   => $outstanding,
            ],
        ]);
    }

    public function lookup(LookupRequest $request)
    {
        $data = $request->validated();

        $invoice = Invoice::query()
            ->with(['contract.tenant:id,name'])
            ->where('number', $data['number'])
            ->first();

        if (!$invoice) {
            return response()->json(['message' => __('management/invoices.not_found')], 404);
        }

        $totals      = $this->invoices->totals($invoice);
        $outstanding = (int) ($invoice->outstanding_idr ?? $totals['outstanding']);

        $eligibleStatus = in_array((string) $invoice->status->value, [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value], true);

        $lc = $invoice->contract;
        $lt = $lc?->tenant;

        return response()->json([
            'id'          => (string) $invoice->id,
            'number'      => $invoice->number,
            'amount'      => (int) $invoice->amount_idr,
            'status'      => (string) $invoice->status->value,
            'tenant_name' => $lt?->name,
            'outstanding' => $outstanding,
            'eligible'    => $eligibleStatus && $outstanding > 0,
        ]);
    }

    public function generate(GenerateInvoiceRequest $request)
    {
        $data     = $request->validated();
        $contract = Contract::findOrFail($data['contract_id']);

        if (in_array((string) $contract->status->value, [ContractStatus::CANCELLED->value, ContractStatus::COMPLETED->value], true)) {
            return back()->with('error', __('management/invoices.contract_invalid_for_generation'));
        }

        // Prevent generating for fully-paid contracts
        if (!empty($contract->paid_in_full_at)) {
            return back()->with('error', __('management/invoices.contract_already_paid_in_full'));
        }

        $period  = (string) $contract->billing_period->value;
        $mode    = (string) $data['mode'];
        $options = [];

        // Special handling: Monthly + mode "full" should backfill ALL missing months (no active invoices),
        // not just the last month. This covers cases where some months were cancelled.
        if ($period === BillingPeriod::MONTHLY->value && $mode === 'full') {
            $startMonth     = Carbon::parse($contract->start_date)->startOfMonth();
            $endMonth       = Carbon::parse($contract->end_date)->startOfMonth();
            $missing        = [];
            $activeStatuses = [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value, InvoiceStatus::PAID->value];

            $cursor = $startMonth->copy();
            while ($cursor->lessThanOrEqualTo($endMonth)) {
                $mStart = $cursor->copy()->startOfMonth();
                $mEnd   = $cursor->copy()->addMonthNoOverflow()->subDay();

                $hasActive = \App\Models\Invoice::query()
                    ->where('contract_id', $contract->id)
                    ->whereDate('period_start', '<=', $mEnd->toDateString())
                    ->whereDate('period_end', '>=', $mStart->toDateString())
                    ->whereIn('status', $activeStatuses)
                    ->exists();
                if (!$hasActive) {
                    $missing[] = $mStart->format('Y-m');
                }
                $cursor = $cursor->copy()->addMonthNoOverflow();
            }

            if (count($missing) === 0) {
                return redirect()->route('management.invoices.index')->with('success', __('management/invoices.no_missing_months'));
            }

            $created = 0;
            foreach ($missing as $ym) {
                try {
                    $this->invoices->generate($contract, ['month' => $ym, 'backfill' => true]);
                    $created++;
                } catch (\Throwable $e) {
                    continue;
                }
            }

            if ($created > 0) {
                $this->logEvent(
                    event: 'invoice_generated',
                    causer: $request->user(),
                    subject: $contract,
                    properties: [
                        'contract_id' => (string) $contract->id,
                        'mode'        => 'full_backfill',
                        'months'      => $missing,
                        'created'     => $created,
                        'reason'      => (string) $data['reason'],
                    ],
                );

                return redirect()->route('management.invoices.index')->with('success', __('management/invoices.generate_backfill_success', ['count' => $created]));
            }

            return back()->with('error', __('management/invoices.generate_backfill_failed'));
        }
        $range = $data['range'] ?? null;
        if (is_array($range) && (!empty($range['from']) && !empty($range['to']))) {
            $options = ['range' => ['from' => (string) $range['from'], 'to' => (string) $range['to']]];
        } elseif (in_array($period, [BillingPeriod::DAILY->value, BillingPeriod::WEEKLY->value], true)) {
            $mode    = 'full';
            $options = ['full' => true];
        } elseif ($period === BillingPeriod::MONTHLY->value && $mode === 'per_month') {
            $periodMonth = (string) ($data['period_month'] ?? '');
            if ($periodMonth === '') {
                return back()->with('error', __('management/invoices.period_month_required'));
            }

            try {
                $monthStart = Carbon::createFromFormat('Y-m', $periodMonth)->startOfMonth();
            } catch (\Throwable $e) {
                return back()->with('error', __('management/invoices.period_month_invalid'));
            }

            $contractStart = Carbon::parse($contract->start_date)->startOfDay();
            $contractEnd   = Carbon::parse($contract->end_date)->startOfDay();
            if ($monthStart->greaterThan($contractEnd) || $monthStart->lessThan($contractStart->startOfMonth())) {
                return back()->with('error', __('management/invoices.period_month_out_of_range'));
            }
            $options = ['month' => $periodMonth];
        } else {
            $options = ['full' => true];
        }

        try {
            $invoice = $this->invoices->generate($contract, $options);
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage() ?: __('management/invoices.generate_failed_generic'));
        }

        $this->logEvent(
            event: 'invoice_generated',
            causer: $request->user(),
            subject: $invoice,
            properties: [
                'contract_id' => (string) $contract->id,
                'mode'        => $mode,
                'options'     => $options,
                'reason'      => (string) $data['reason'],
            ],
        );

        try {
            $tenantId = (int) ($contract->user_id ?? 0);
            if ($tenantId > 0 && isset($invoice)) {
                $this->notifications->notifyUser($tenantId, __('notifications.invoice.created.title'), __('notifications.invoice.created.message', ['number' => (string) $invoice->number]), null, [
                    'scope'       => 'user',
                    'type'        => 'invoice',
                    'event'       => 'created',
                    'invoice_id'  => (string) $invoice->id,
                    'contract_id' => (string) $contract->id,
                ]);
            }
        } catch (\Throwable) {
            // ignore;
        }

        return redirect()->route('management.invoices.index')->with('success', __('management/invoices.created'));
    }

    public function print(Request $request, Invoice $invoice)
    {
        $auto   = (bool) $request->boolean('auto');
        $inv    = $invoice->fresh(['contract.tenant', 'contract.room']);
        $c      = $inv->contract;
        $tenant = $c?->tenant;
        $room   = $c?->room;

        $dto = [
            'number'       => $inv->number,
            'status'       => $inv->status->value,
            'issued_at'    => $inv->created_at->toDateString(),
            'due_date'     => $inv->due_date->toDateString(),
            'period_start' => $inv->period_start->toDateString(),
            'period_end'   => $inv->period_end->toDateString(),
            'amount_idr'   => (int) $inv->amount_idr,
            'items'        => (array) ($inv->items ?? []),
            'tenant'       => $tenant ? [
                'name'  => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
            ] : null,
            'room' => $room ? [
                'number' => $room->number,
                'name'   => $room->name,
            ] : null,
            'contract_id' => $c?->id ? (string) $c->id : null,
        ];

        $html = view('pdf.invoice', [
            'invoice'   => $dto,
            'autoPrint' => $auto,
        ])->render();

        if (!$auto && class_exists(Pdf::class)) {
            try {
                /** @var \Barryvdh\DomPDF\PDF $pdf */
                $pdf = Pdf::loadHTML($html);

                return $pdf->stream($invoice->number . '.pdf');
            } catch (\Throwable $e) {
                // fallthrough to HTML
            }
        }

        return response($html);
    }

    public function extendDue(ExtendDueRequest $request, Invoice $invoice)
    {
        $data   = $request->validated();
        $reason = (string) ($data['reason'] ?? '');

        if (!in_array((string) $invoice->status->value, [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value], true)) {
            return back()->with('error', __('management/invoices.extend.only_pending_overdue'));
        }

        $prevDue = $invoice->due_date->toDateString();

        try {
            $newDue = Carbon::parse((string) $data['due_date'])->startOfDay();
        } catch (\Throwable $e) {
            return back()->with('error', __('management/invoices.extend.invalid_due_format'));
        }

        $currentDue = $invoice->due_date->copy()->startOfDay();
        if ($currentDue && $newDue->lessThanOrEqualTo($currentDue)) {
            return back()->with('error', __('management/invoices.extend.due_must_be_greater', ['current' => $currentDue->toDateString()]));
        }

        try {
            $updated = $this->invoices->extendDue($invoice, $newDue->toDateString(), $reason);
        } catch (\Throwable $e) {
            return back()->with('error', __('management/invoices.extend.failed'));
        }

        if (!$updated) {
            return back()->with('error', __('management/invoices.extend.not_extendable'));
        }

        $invoice->refresh();

        $contract = $invoice->contract;
        $this->logEvent(
            event: 'invoice_due_extended',
            causer: $request->user(),
            subject: $invoice,
            properties: [
                'invoice_id'  => (string) $invoice->id,
                'from_due'    => $prevDue,
                'to_due'      => $invoice->due_date->toDateString(),
                'reason'      => $reason,
                'contract_id' => $contract?->id ? (string) $contract->id : null,
            ],
        );

        try {
            $tenantId = (int) ($contract?->user_id);
            if ($tenantId > 0) {
                $this->notifications->notifyUser($tenantId, __('notifications.invoice.due_extended.title'), __('notifications.invoice.due_extended.message', ['number' => (string) $invoice->number, 'due' => $invoice->due_date->toDateString()]), null, [
                    'scope'      => 'user',
                    'type'       => 'invoice',
                    'event'      => 'due_extended',
                    'invoice_id' => (string) $invoice->id,
                    'from_due'   => $prevDue,
                    'to_due'     => $invoice->due_date->toDateString(),
                ]);
            }
        } catch (\Throwable) {
        }

        return back()->with('success', __('management/invoices.extend.success'));
    }

    public function cancel(ReasonRequest $request, Invoice $invoice)
    {
        $prev = (string) $invoice->status->value;

        $data   = $request->validated();
        $reason = (string) ($data['reason'] ?? '');

        if ($invoice->status === InvoiceStatus::PAID) {
            return back()->with('error', __('management/invoices.cancel.already_paid'));
        }

        $hasCompletedPayment = $invoice->payments()
            ->where('status', PaymentStatus::COMPLETED->value)
            ->exists();
        if ($hasCompletedPayment) {
            return back()->with('error', __('management/invoices.cancel.has_completed_payment'));
        }

        if ($invoice->status === InvoiceStatus::CANCELLED) {
            return back()->with('success', __('management/invoices.cancel.already_cancelled'));
        }

        try {
            $changed = $this->invoices->cancel($invoice, $reason);
        } catch (\Throwable $e) {
            return back()->with('error', __('management/invoices.cancel.failed'));
        }

        $invoice->refresh();

        $this->logEvent(
            event: 'invoice_cancelled',
            causer: $request->user(),
            subject: $invoice,
            properties: [
                'previous_status' => $prev,
                'current_status'  => (string) $invoice->status->value,
                'reason'          => $reason,
            ],
        );

        if ($changed) {
            try {
                /** @var \App\Models\Contract|null $contract */
                $contract = $invoice->relationLoaded('contract') ? $invoice->contract : $invoice->contract()->first();
                $tenantId = $contract?->user_id ? (int) $contract->user_id : 0;
                if ($tenantId > 0) {
                    $this->notifications->notifyUser($tenantId, __('notifications.invoice.cancelled.title'), __('notifications.invoice.cancelled.message', ['number' => (string) $invoice->number]), null, [
                        'scope'      => 'user',
                        'type'       => 'invoice',
                        'event'      => 'cancelled',
                        'invoice_id' => (string) $invoice->id,
                        'reason'     => $reason,
                    ]);
                }
            } catch (\Throwable) {
            }

            return back()->with('success', __('management/invoices.cancel.success'));
        }

        return back()->with('success', __('management/invoices.cancel.already_cancelled'));
    }
}
