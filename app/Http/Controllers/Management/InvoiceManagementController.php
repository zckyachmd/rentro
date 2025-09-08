<?php

namespace App\Http\Controllers\Management;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Invoice\CancelInvoiceRequest;
use App\Http\Requests\Management\Invoice\ExtendDueRequest;
use App\Http\Requests\Management\Invoice\GenerateInvoiceRequest;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\User;
use App\Services\Contracts\InvoiceServiceInterface;
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

    public function __construct(private InvoiceServiceInterface $invoices)
    {
    }

    public function index(Request $request)
    {
        $query = Invoice::query()
            ->with([
                'contract:id,user_id,room_id',
                'contract.tenant:id,name',
                'contract.room:id,number',
            ]);

        $options = [
            'search_param' => 'search',
            'searchable'   => [
                'number',
                'contract.tenant.name',
                'contract.room.number',
            ],
            'sortable' => [
                'number'       => 'number',
                'due_date'     => 'due_date',
                'amount_cents' => 'amount_cents',
                'status'       => 'status',
            ],
            'default_sort' => ['due_date', 'desc'],
            'filters'      => [
                'status' => function ($q, $status) {
                    $q->where('status', $status);
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\App\Models\Invoice> $page */
        $page = $this->applyTable($query, $request, $options);

        $mapped = $page->getCollection()->map(function (Invoice $inv) {
            /** @var \App\Models\Contract|null $contract */
            $contract = $inv->contract;
            /** @var \App\Models\User|null $tenant */
            $tenant = $contract?->tenant;
            /** @var \App\Models\Room|null $room */
            $room = $contract?->room;

            $outstanding = (int) ($inv->outstanding_cents ?? 0);

            return [
                'id'           => (string) $inv->id,
                'number'       => $inv->number,
                'due_date'     => $inv->due_date->format('Y-m-d'),
                'amount_cents' => (int) $inv->amount_cents,
                'status'       => $inv->status->value,
                'tenant'       => $tenant?->name,
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

        return Inertia::render('management/invoice/index', [
            'invoices' => $invoicesPayload,
            'options'  => [
                'statuses'  => $statusOptions,
                'contracts' => $contracts,
            ],
            'query' => [
                'page'    => $invoicesPayload['current_page'],
                'perPage' => $invoicesPayload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
                'status'  => $request->query('status'),
            ],
        ]);
    }

    public function show(Request $request, Invoice $invoice)
    {
        $invoice->load([
            'contract:id,user_id,room_id,start_date,end_date',
            'contract.tenant:id,name,email,phone',
            'contract.room:id,number,name',
            'payments:id,invoice_id,method,status,amount_cents,paid_at,reference,provider',
        ]);

        /** @var Contract|null $c */
        $c = $invoice->contract;
        /** @var \App\Models\User|null $tenant */
        $tenant = $c?->tenant;
        /** @var \App\Models\Room|null $room */
        $room = $c?->room;

        $dto = [
            'id'           => (string) $invoice->id,
            'number'       => $invoice->number,
            'status'       => $invoice->status->value,
            'due_date'     => $invoice->due_date->toDateString(),
            'period_start' => $invoice->period_start->toDateString(),
            'period_end'   => $invoice->period_end->toDateString(),
            'amount_cents' => (int) $invoice->amount_cents,
            'items'        => (array) ($invoice->items ?? []),
            'paid_at'      => $invoice->paid_at?->toDateTimeString(),
            'created_at'   => $invoice->created_at->toDateTimeString(),
            'updated_at'   => $invoice->updated_at->toDateTimeString(),
            'release_day'  => (int) AppSetting::config('billing.release_day_of_month', 1),
        ];

        $contractDTO = $c ? [
            'id'         => (string) $c->id,
            'start_date' => $c->start_date->toDateString(),
            'end_date'   => $c->end_date->toDateString(),
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

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Payment> $paymentsCollection */
        $paymentsCollection = $invoice->payments;
        $payments           = $paymentsCollection
            ->sortBy(function (\App\Models\Payment $p) {
                return ($p->paid_at?->getTimestamp() ?? 0) ?: ($p->created_at?->getTimestamp() ?? 0);
            })
            ->values()
            ->map(function (\App\Models\Payment $p) {
                return [
                    'id'           => (string) $p->id,
                    'method'       => (string) $p->method->value,
                    'status'       => (string) $p->status->value,
                    'amount_cents' => (int) $p->amount_cents,
                    'paid_at'      => $p->paid_at?->toDateTimeString(),
                    'reference'    => $p->reference,
                    'provider'     => $p->provider,
                ];
            });

        $totalInvoice = (int) $invoice->amount_cents;
        $totalPaid    = (int) $invoice->payments()->where('status', PaymentStatus::COMPLETED->value)->sum('amount_cents');
        $outstanding  = (int) ($invoice->outstanding_cents ?? max(0, $totalInvoice - $totalPaid));

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

    public function lookup(Request $request)
    {
        $request->validate([
            'number' => ['required', 'string'],
        ]);

        $invoice = Invoice::query()
            ->with(['contract.tenant:id,name'])
            ->where('number', $request->string('number'))
            ->first();
        /** @var \App\Models\Invoice|null $invoice */

        if (!$invoice) {
            return response()->json(['message' => 'Invoice tidak ditemukan'], 404);
        }

        $totalInvoice = (int) $invoice->amount_cents;
        $totalPaid    = (int) $invoice->payments()
            ->where('status', PaymentStatus::COMPLETED->value)
            ->sum('amount_cents');
        $outstanding = (int) ($invoice->outstanding_cents ?? max(0, $totalInvoice - $totalPaid));

        $eligibleStatus = in_array((string) $invoice->status->value, [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value], true);

        /** @var \App\Models\Contract|null $lc */
        $lc = $invoice->contract;
        /** @var \App\Models\User|null $lt */
        $lt = $lc?->tenant;

        return response()->json([
            'id'          => (string) $invoice->id,
            'number'      => $invoice->number,
            'amount'      => (int) $invoice->amount_cents,
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
            return back()->with('error', 'Kontrak tidak valid untuk generate invoice.');
        }

        $period  = (string) $contract->billing_period->value;
        $mode    = (string) $data['mode'];
        $options = [];
        $range   = $data['range'] ?? null;
        if (is_array($range) && (!empty($range['from']) && !empty($range['to']))) {
            $options = ['range' => ['from' => (string) $range['from'], 'to' => (string) $range['to']]];
        } elseif (in_array($period, [BillingPeriod::DAILY->value, BillingPeriod::WEEKLY->value], true)) {
            $mode    = 'full';
            $options = ['full' => true];
        } elseif ($period === BillingPeriod::MONTHLY->value && $mode === 'per_month') {
            $periodMonth = (string) ($data['period_month'] ?? '');
            if ($periodMonth === '') {
                return back()->with('error', 'Bulan periode wajib dipilih untuk mode Bulanan.');
            }

            try {
                $monthStart = Carbon::createFromFormat('Y-m', $periodMonth)->startOfMonth();
            } catch (\Throwable $e) {
                return back()->with('error', 'Format bulan periode tidak valid.');
            }

            $contractStart = Carbon::parse($contract->start_date)->startOfDay();
            $contractEnd   = Carbon::parse($contract->end_date)->startOfDay();
            if ($monthStart->greaterThan($contractEnd) || $monthStart->lessThan($contractStart->startOfMonth())) {
                return back()->with('error', 'Bulan yang dipilih berada di luar masa kontrak.');
            }
            $options = ['month' => $periodMonth];
        } else {
            $options = ['full' => true];
        }

        try {
            $invoice = $this->invoices->generate($contract, $options);
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage() ?: 'Gagal generate invoice.');
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

        return redirect()->route('management.invoices.index')->with('success', 'Invoice berhasil dibuat.');
    }

    public function print(Request $request, Invoice $invoice)
    {
        $auto = (bool) $request->boolean('auto');
        $inv  = $invoice->fresh(['contract.tenant', 'contract.room']);
        /** @var \App\Models\Invoice $inv */
        $c = $inv->contract;
        /** @var \App\Models\Contract|null $c */
        $tenant = $c?->tenant;
        /** @var \App\Models\User|null $tenant */
        $room = $c?->room;
        /** @var \App\Models\Room|null $room */

        $dto = [
            'number'       => $inv->number,
            'status'       => $inv->status->value,
            'issued_at'    => $inv->created_at->toDateString(),
            'due_date'     => $inv->due_date->toDateString(),
            'period_start' => $inv->period_start->toDateString(),
            'period_end'   => $inv->period_end->toDateString(),
            'amount_cents' => (int) $inv->amount_cents,
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
            return back()->with('error', 'Hanya invoice Pending atau Overdue yang dapat diperpanjang.');
        }

        $prevDue = $invoice->due_date->toDateString();

        try {
            $newDue = Carbon::parse((string) $data['due_date'])->startOfDay();
        } catch (\Throwable $e) {
            return back()->with('error', 'Format tanggal jatuh tempo tidak valid.');
        }

        $currentDue = $invoice->due_date->copy()->startOfDay();
        if ($currentDue && $newDue->lessThanOrEqualTo($currentDue)) {
            return back()->with('error', 'Tanggal jatuh tempo baru harus lebih besar dari tanggal sebelumnya (' . $currentDue->toDateString() . ').');
        }

        try {
            $updated = $this->invoices->extendDue($invoice, $newDue->toDateString(), $reason);
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal memperpanjang jatuh tempo.');
        }

        if (!$updated) {
            return back()->with('error', 'Invoice tidak dapat diperpanjang.');
        }

        $invoice->refresh();

        /** @var \App\Models\Contract|null $contract */
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

        return back()->with('success', 'Masa tenggat invoice berhasil diperpanjang.');
    }

    public function cancel(CancelInvoiceRequest $request, Invoice $invoice)
    {
        $prev = (string) $invoice->status->value;

        $data   = $request->validated();
        $reason = (string) ($data['reason'] ?? '');

        if ($invoice->status === InvoiceStatus::PAID) {
            return back()->with('error', 'Invoice sudah dibayar dan tidak dapat dibatalkan.');
        }

        $hasCompletedPayment = $invoice->payments()
            ->where('status', PaymentStatus::COMPLETED->value)
            ->exists();
        if ($hasCompletedPayment) {
            return back()->with('error', 'Invoice memiliki pembayaran yang sudah selesai dan tidak dapat dibatalkan.');
        }

        if ($invoice->status === InvoiceStatus::CANCELLED) {
            return back()->with('info', 'Invoice sudah dalam status Cancelled.');
        }

        try {
            $changed = $this->invoices->cancel($invoice, $reason);
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal membatalkan invoice.');
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
            return back()->with('success', 'Invoice dibatalkan.');
        }

        return back()->with('info', 'Invoice sudah dalam status Cancelled.');
    }
}
