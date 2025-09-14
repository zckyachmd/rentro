<?php

namespace App\Http\Controllers\Management;

use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Payment\StorePaymentRequest;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Contracts\InvoiceServiceInterface;
use App\Services\PaymentService;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PaymentManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function __construct(private readonly PaymentService $payments, private readonly InvoiceServiceInterface $invoices)
    {
    }

    public function index(Request $request)
    {
        $query = Payment::query()->with([
            'invoice:id,number,contract_id',
            'invoice.contract:id,user_id,room_id',
            'invoice.contract.tenant:id,name',
        ]);

        $options = [
            'search_param' => 'search',
            'searchable'   => [
                'reference',
                ['relation' => 'invoice', 'column' => 'number'],
                ['relation' => 'invoice.contract.tenant', 'column' => 'name'],
            ],
            'sortable' => [
                'paid_at'      => 'paid_at',
                'created_at'   => 'created_at',
                'amount_cents' => 'amount_cents',
                'status'       => 'status',
                'method'       => 'method',
            ],
            'default_sort' => ['created_at', 'desc'],
            'filters'      => [
                'status' => function ($q, $status) {
                    $q->where('status', $status);
                },
                'method' => function ($q, $method) {
                    $q->where('method', $method);
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<Payment> $page */
        $page = $this->applyTable($query, $request, $options);

        $mapped = $page->getCollection()->map(function (Payment $p) {
            /** @var \App\Models\Invoice|null $invoice */
            $invoice = $p->invoice;
            /** @var \App\Models\Contract|null $contract */
            $contract = $invoice?->contract;
            /** @var \App\Models\User|null $tenant */
            $tenant = $contract?->tenant;

            return [
                'id'           => (string) $p->id,
                'method'       => (string) $p->method->value,
                'status'       => (string) $p->status->value,
                'amount_cents' => (int) $p->amount_cents,
                'paid_at'      => $p->paid_at?->toDateTimeString(),
                'invoice'      => $invoice?->number,
                'tenant'       => $tenant?->name,
            ];
        });

        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        return Inertia::render('management/payment/index', [
            'payments' => $payload,
            'filters'  => [
                'status' => $request->query('status'),
                'method' => $request->query('method'),
            ],
            'options' => [
                'methods'  => PaymentMethod::options(true),
                'statuses' => array_map(fn ($c) => $c->value, PaymentStatus::cases()),
            ],
            'query' => [
                'page'    => $payload['current_page'],
                'perPage' => $payload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
                'status'  => $request->query('status'),
                'method'  => $request->query('method'),
            ],
        ]);
    }

    public function store(StorePaymentRequest $request)
    {
        $data    = $request->validated();
        $invoice = Invoice::findOrFail($data['invoice_id']);

        $totals      = $this->invoices->totals($invoice);
        $outstanding = (int) $totals['outstanding'];

        if ($outstanding <= 0) {
            return back()->with('error', 'Invoice sudah lunas.');
        }
        if ((int) $data['amount_cents'] <= 0) {
            return back()->with('error', 'Nominal pembayaran harus lebih dari 0.');
        }
        if ((int) $data['amount_cents'] > $outstanding) {
            return back()->with('error', 'Nominal melebihi sisa tagihan.');
        }

        $payment = $this->payments->createPayment(
            invoice: $invoice,
            data: $data,
            user: $request->user(),
            attachment: $request->file('attachment'),
        );

        $this->logEvent(
            event: 'payment_created',
            causer: $request->user(),
            subject: $payment,
            properties: [
                'invoice_id'   => (string) $invoice->getAttribute('id'),
                'method'       => (string) $payment->method->value,
                'status'       => (string) $payment->status->value,
                'amount_cents' => (int) $payment->amount_cents,
            ],
        );

        return back()->with('success', 'Pembayaran berhasil dicatat.');
    }

    public function void(\Illuminate\Http\Request $request, Payment $payment)
    {
        $request->validate([
            'reason' => ['nullable', new \App\Rules\Reason(0, 200)],
        ]);
        if ($payment->status === PaymentStatus::CANCELLED) {
            return back()->with('info', 'Pembayaran sudah dibatalkan sebelumnya.');
        }

        $this->payments->voidPayment($payment, (string) $request->string('reason'), $request->user());

        $this->logEvent(
            event: 'payment_voided',
            causer: $request->user(),
            subject: $payment,
            properties: [
                'invoice_id' => (string) $payment->getAttribute('invoice_id'),
                'reason'     => (string) $request->string('reason'),
            ],
        );

        return back()->with('success', 'Pembayaran dibatalkan (void) dan sisa tagihan dipulihkan.');
    }

    public function show(Request $request, Payment $payment)
    {
        $payment->load([
            'invoice:id,number,contract_id,amount_cents,due_date,status,paid_at',
            'invoice.contract:id,user_id,room_id,start_date,end_date,status',
            'invoice.contract.tenant:id,name,email,phone',
            'invoice.contract.room:id,number,name',
        ]);

        if ($request->wantsJson()) {
            $inv = $payment->invoice;
            /** @var \App\Models\Invoice|null $inv */
            $contract = $inv?->contract;
            /** @var \App\Models\Contract|null $contract */
            $tenant = $contract?->tenant;
            /** @var \App\Models\User|null $tenant */
            $room = $contract?->room;
            /* @var \App\Models\Room|null $room */

            return response()->json([
                'payment' => [
                    'id'                     => (string) $payment->id,
                    'method'                 => (string) $payment->method->value,
                    'status'                 => (string) $payment->status->value,
                    'amount_cents'           => (int) $payment->amount_cents,
                    'paid_at'                => $payment->paid_at?->toDateTimeString(),
                    'reference'              => $payment->reference,
                    'provider'               => $payment->provider,
                    'note'                   => $payment->note,
                    'recorded_by'            => (string) ($payment->meta['recorded_by'] ?? ''),
                    'attachment'             => (string) ($payment->meta['evidence_path'] ?? ''),
                    'attachment_name'        => (string) (($payment->meta['evidence_path'] ?? '') ? basename((string) $payment->meta['evidence_path']) : ''),
                    'attachment_uploaded_at' => (string) ($payment->meta['evidence_uploaded_at'] ?? ''),
                    'pre_outstanding_cents'  => (int) ($payment->pre_outstanding_cents ?? 0),
                ],
                'invoice' => $inv ? [
                    'id'           => (string) $inv->getAttribute('id'),
                    'number'       => (string) $inv->getAttribute('number'),
                    'amount_cents' => (int) $inv->getAttribute('amount_cents'),
                    'due_date'     => $inv->due_date ? $inv->due_date->toDateString() : null,
                    'status'       => (string) $inv->status->value,
                    'paid_at'      => $inv->paid_at?->toDateTimeString(),
                ] : null,
                'tenant' => $tenant ? [
                    'id'    => (string) $tenant->getAttribute('id'),
                    'name'  => (string) $tenant->getAttribute('name'),
                    'email' => (string) $tenant->getAttribute('email'),
                    'phone' => (string) $tenant->getAttribute('phone'),
                ] : null,
                'room' => $room ? [
                    'id'     => (string) $room->getAttribute('id'),
                    'number' => (string) $room->getAttribute('number'),
                    'name'   => (string) $room->getAttribute('name'),
                ] : null,
            ]);
        }

        return redirect()->route('management.payments.index');
    }

    public function print(Payment $payment)
    {
        $payment->load(['invoice:id,number,contract_id,amount_cents', 'invoice.contract:id,user_id,room_id,start_date,end_date', 'invoice.contract.tenant:id,name,email,phone', 'invoice.contract.room:id,number,name']);

        $dto = [
            'id'           => (string) $payment->id,
            'method'       => (string) $payment->method->value,
            'status'       => (string) $payment->status->value,
            'amount_cents' => (int) $payment->amount_cents,
            'paid_at'      => $payment->paid_at?->toDateTimeString(),
            'reference'    => $payment->reference,
            'note'         => $payment->note,
            'attachment'   => (string) ($payment->meta['evidence_path'] ?? ''),
        ];

        /** @var \App\Models\Invoice|null $invoice */
        $invoice = $payment->invoice;
        /** @var \App\Models\Contract|null $contract */
        $contract = $invoice?->contract;
        /** @var \App\Models\User|null $tenant */
        $tenant = $contract?->tenant;
        /** @var \App\Models\Room|null $room */
        $room = $contract?->room;

        $items        = $invoice ? (array) ($invoice->items ?? []) : [];
        $totalInvoice = $invoice ? (int) $invoice->amount_cents : 0;
        $currentPaid  = (int) $payment->amount_cents;

        if ($invoice) {
            $preOutstanding = $payment->pre_outstanding_cents;
            if ($preOutstanding === null) {
                $query = $invoice->payments()->where('status', PaymentStatus::COMPLETED->value);
                if ($payment->paid_at) {
                    $query->where('paid_at', '<', $payment->paid_at);
                } else {
                    $query->where('id', '<', $payment->id);
                }
                $paidBefore     = (int) $query->sum('amount_cents');
                $preOutstanding = max(0, $totalInvoice - $paidBefore);
            }
            $postOutstanding = max(0, $preOutstanding - $currentPaid);
        } else {
            $preOutstanding  = 0;
            $postOutstanding = 0;
        }

        $recordedName = $payment->meta['recorded_by'] ?? null;
        if (!$recordedName) {
            try {
                /** @var \Spatie\Activitylog\Models\Activity|null $act */
                $act = \Spatie\Activitylog\Models\Activity::query()
                    ->where('subject_type', Payment::class)
                    ->where('subject_id', $payment->id)
                    ->where('event', 'payment_created')
                    ->latest('id')
                    ->first();
                $recordedName = null;
                $causer       = $act?->causer;
                if ($causer instanceof \App\Models\User) {
                    $recordedName = $causer->name;
                }
            } catch (\Throwable $e) {
                $recordedName = null;
            }
        }
        $recordedBy = $recordedName ?: null;

        $html = view('pdf.receipt', [
            'payment' => $dto,
            'invoice' => $invoice ? [
                'number'       => (string) $invoice->getAttribute('number'),
                'amount_cents' => $totalInvoice,
                'items'        => $items,
            ] : null,
            'tenant' => $tenant ? [
                'name'  => (string) $tenant->getAttribute('name'),
                'email' => (string) $tenant->getAttribute('email'),
                'phone' => (string) $tenant->getAttribute('phone'),
            ] : null,
            'room' => $room ? [
                'number' => $room->number,
                'name'   => $room->name,
            ] : null,
            'summary' => [
                'total_invoice'    => $totalInvoice,
                'pre_outstanding'  => (int) $preOutstanding,
                'current_paid'     => $currentPaid,
                'post_outstanding' => (int) $postOutstanding,
            ],
            'recorded_by' => $recordedBy,
        ])->render();

        if (class_exists(Pdf::class)) {
            try {
                /** @var \Barryvdh\DomPDF\PDF $pdf */
                $pdf = Pdf::loadHTML($html);
                // Set custom receipt paper size (80mm width x ~500mm height)
                $w = 80 * 72.0 / 25.4; // mm to pt
                $h = 500 * 72.0 / 25.4; // generous height to keep one page
                $pdf->setPaper([0, 0, $w, $h], 'portrait');

                return $pdf->stream('Receipt-' . ($invoice?->number ?: $payment->id) . '.pdf');
            } catch (\Throwable $e) {
                // fallthrough to HTML
            }
        }

        return response($html);
    }

    public function attachment(Payment $payment)
    {
        $path = (string) ($payment->meta['evidence_path'] ?? '');
        if (!$path || !Storage::exists($path)) {
            abort(404);
        }

        $absolute = Storage::path($path);
        try {
            return response()->file($absolute);
        } catch (\Throwable $e) {
            $content = Storage::get($path);
            $mime    = Storage::mimeType($path) ?: 'application/octet-stream';

            return response($content, 200, [
                'Content-Type'        => $mime,
                'Content-Disposition' => 'inline',
            ]);
        }
    }
}
