<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Invoice;
use App\Services\Contracts\InvoiceServiceInterface;
use App\Traits\DataTable;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    use DataTable;

    public function __construct(private InvoiceServiceInterface $invoices)
    {
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $query = Invoice::query()
            ->whereHas('contract', fn ($q) => $q->where('user_id', $userId))
            ->with(['contract.room:id,number'])
            ->select(['id', 'number', 'contract_id', 'due_date', 'amount_idr', 'outstanding_idr', 'status']);

        $options = [
            'search_param' => 'q',
            'searchable'   => [
                'number',
                ['relation' => 'contract.room', 'column' => 'number'],
                function ($q, string $term) {
                    if (preg_match('/^contract:(\d+)$/i', trim($term), $m)) {
                        $q->orWhere('contract_id', (int) $m[1]);
                    }
                },
            ],
            'sortable' => [
                'number'          => 'number',
                'due_date'        => 'due_date',
                'amount_idr'      => 'amount_idr',
                'outstanding_idr' => 'outstanding_idr',
                'status'          => 'status',
            ],
            'default_sort' => ['due_date', 'desc'],
            'filters'      => [
                'status' => function ($q, $status): void {
                    $q->where('status', $status);
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<Invoice> $page */
        $page = $this->applyTable($query, $request, $options);

        $mapped = $page->getCollection()->map(function (Invoice $inv): array {
            $contract = $inv->contract;
            $room     = $contract?->room;

            return [
                'id'              => (string) $inv->id,
                'number'          => (string) $inv->number,
                'due_date'        => $inv->due_date ? $inv->due_date->toDateString() : null,
                'amount_idr'      => (int) $inv->amount_idr,
                'outstanding_idr' => (int) ($inv->outstanding_idr ?? 0),
                'status'          => (string) $inv->status->value,
                'room_number'     => $room ? $room->number : null,
            ];
        });
        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        $manualBanks = AppSetting::config('payments.manual_bank_accounts', []);

        $vaBanks = (array) config('midtrans.va_banks', []);

        return Inertia::render('tenant/invoice/index', [
            'invoices' => $payload,
            'query'    => [
                'page'     => $payload['current_page'],
                'per_page' => $payload['per_page'],
                'sort'     => $request->query('sort'),
                'dir'      => $request->query('dir'),
                'q'        => $request->query('q'),
                'status'   => $request->query('status'),
            ],
            'options' => [
                'statuses' => array_map(fn ($c) => $c->value, \App\Enum\InvoiceStatus::cases()),
            ],
            'midtrans' => [
                'client_key'    => (string) config('midtrans.client_key'),
                'is_production' => (bool) config('midtrans.is_production', false),
                'banks'         => array_values(array_map('strval', $vaBanks)),
            ],
            'payments' => [
                'manual_banks' => is_array($manualBanks) ? array_values($manualBanks) : [],
            ],
        ]);
    }

    public function show(Request $request, Invoice $invoice)
    {
        $invoice->load(['contract:id,user_id,room_id,start_date,end_date', 'contract.room:id,number,name']);
        $contract = $invoice->contract;
        if (!($contract instanceof \App\Models\Contract) || (string) $contract->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        if ($request->wantsJson()) {
            $tenant = $request->user();
            $room   = $contract->room;

            /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Payment> $paymentCollection */
            $paymentCollection = $invoice->payments()
                ->orderByDesc('paid_at')
                ->get(['id', 'method', 'status', 'amount_idr', 'paid_at', 'reference', 'provider']);

            $payments = $paymentCollection->map(function ($p): array {
                $meta         = (array) ($p->meta ?? []);
                $reviewMeta   = (array) ($meta['review'] ?? []);
                $rejectReason = (string) ($reviewMeta['reason'] ?? '');
                $note         = (string) ($p->note ?? '');
                $reviewBy     = (string) ($reviewMeta['confirmed_by'] ?? ($reviewMeta['rejected_by'] ?? ''));
                $reviewAt     = (string) ($reviewMeta['confirmed_at'] ?? ($reviewMeta['rejected_at'] ?? ''));
                $receiver     = (array) ($meta['receiver'] ?? []);

                return [
                    'id'               => (string) $p->id,
                    'method'           => (string) $p->method->value,
                    'status'           => (string) $p->status->value,
                    'amount_idr'       => (int) $p->amount_idr,
                    'paid_at'          => $p->paid_at ? $p->paid_at->toDateTimeString() : null,
                    'reference'        => $p->reference,
                    'provider'         => $p->provider,
                    'note'             => $note !== '' ? $note : null,
                    'reject_reason'    => $rejectReason !== '' ? $rejectReason : null,
                    'review_by'        => $reviewBy !== '' ? $reviewBy : null,
                    'review_at'        => $reviewAt !== '' ? $reviewAt : null,
                    'receiver_bank'    => isset($receiver['bank']) ? (string) $receiver['bank'] : null,
                    'receiver_account' => isset($receiver['account']) ? (string) $receiver['account'] : null,
                    'receiver_holder'  => isset($receiver['holder']) ? (string) $receiver['holder'] : null,
                ];
            });

            $totals      = $this->invoices->totals($invoice);
            $totalPaid   = (int) $totals['total_paid'];
            $outstanding = (int) $totals['outstanding'];

            return response()->json([
                'invoice' => [
                    'id'           => (string) $invoice->id,
                    'number'       => (string) $invoice->number,
                    'status'       => (string) $invoice->status->value,
                    'due_date'     => $invoice->due_date ? $invoice->due_date->toDateString() : null,
                    'period_start' => $invoice->period_start ? $invoice->period_start->toDateString() : null,
                    'period_end'   => $invoice->period_end ? $invoice->period_end->toDateString() : null,
                    'amount_idr'   => (int) $invoice->amount_idr,
                    'items'        => (array) ($invoice->items ?? []),
                    'paid_at'      => $invoice->paid_at ? $invoice->paid_at->toDateTimeString() : null,
                    'created_at'   => $invoice->created_at ? $invoice->created_at->toDateTimeString() : null,
                ],
                'contract' => [
                    'id'         => (string) $contract->id,
                    'start_date' => $contract->start_date ? $contract->start_date->toDateString() : null,
                    'end_date'   => $contract->end_date ? $contract->end_date->toDateString() : null,
                ],
                'tenant' => $tenant ? [
                    'id'    => (string) $tenant->id,
                    'name'  => (string) $tenant->name,
                    'email' => (string) ($tenant->email ?? ''),
                    'phone' => (string) ($tenant->phone ?? ''),
                ] : null,
                'room' => $room ? [
                    'id'     => (string) $room->id,
                    'number' => (string) ($room->number ?? ''),
                    'name'   => (string) ($room->name ?? ''),
                ] : null,
                'payments'        => $payments,
                'payment_summary' => [
                    'total_invoice' => (int) $invoice->amount_idr,
                    'total_paid'    => (int) $totalPaid,
                    'outstanding'   => (int) $outstanding,
                ],
            ]);
        }

        return redirect()->route('tenant.invoices.index');
    }

    public function print(Request $request, Invoice $invoice)
    {
        $invoice->load(['contract:id,user_id,room_id', 'contract.room:id,number,name']);
        $contract = $invoice->contract;
        if (!($contract instanceof \App\Models\Contract) || (string) $contract->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        $c      = $contract;
        $tenant = $request->user();
        $room   = $c->room;

        $dto = [
            'id'           => (string) $invoice->id,
            'number'       => (string) $invoice->number,
            'period_start' => $invoice->period_start ? $invoice->period_start->toDateString() : null,
            'period_end'   => $invoice->period_end ? $invoice->period_end->toDateString() : null,
            'due_date'     => $invoice->due_date ? $invoice->due_date->toDateString() : null,
            'amount_idr'   => (int) $invoice->amount_idr,
            'items'        => (array) ($invoice->items ?? []),
            'status'       => (string) $invoice->status->value,
            'paid_at'      => $invoice->paid_at ? $invoice->paid_at->toDateTimeString() : null,
        ];

        $html = view('pdf.invoice', [
            'invoice' => $dto,
            'tenant'  => $tenant ? [
                'name'  => (string) $tenant->name,
                'email' => (string) ($tenant->email ?? ''),
                'phone' => (string) ($tenant->phone ?? ''),
            ] : null,
            'room' => $room ? [
                'number' => (string) ($room->number ?? ''),
                'name'   => (string) ($room->name ?? ''),
            ] : null,
            'contract_id' => (string) $c->id,
            'autoPrint'   => (bool) $request->boolean('auto', false),
        ])->render();

        if (class_exists(Pdf::class)) {
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
}
