<?php

namespace App\Http\Controllers\Management;

use App\Enum\InvoiceStatus;
use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Payment\AckRequest as PaymentAckRequest;
use App\Http\Requests\Management\Payment\StorePaymentRequest;
use App\Http\Requests\Management\Payment\VoidRequest as PaymentVoidRequest;
use App\Models\AppSetting;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Contracts\InvoiceServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PaymentManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function __construct(private readonly PaymentServiceInterface $payments, private readonly InvoiceServiceInterface $invoices)
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
                'paid_at'    => 'paid_at',
                'created_at' => 'created_at',
                'amount_idr' => 'amount_idr',
                'status'     => 'status',
                'method'     => 'method',
            ],
            'default_sort' => ['created_at', 'desc'],
            'filters'      => [
                'status' => function ($q, $status) {
                    $q->where('status', $status);
                },
                'method' => function ($q, $method) {
                    $q->where('method', $method);
                },
                'start' => function ($q, $start) {
                    try {
                        $d = Carbon::createFromFormat('Y-m-d', (string) $start)->startOfDay()->toDateString();
                    } catch (\Throwable) {
                        return;
                    }
                    $q->where(function ($qq) use ($d) {
                        $qq->whereNotNull('paid_at')->whereDate('paid_at', '>=', $d)
                            ->orWhere(function ($q2) use ($d) {
                                $q2->whereNull('paid_at')->whereDate('created_at', '>=', $d);
                            });
                    });
                },
                'end' => function ($q, $end) {
                    try {
                        $d = Carbon::createFromFormat('Y-m-d', (string) $end)->endOfDay()->toDateString();
                    } catch (\Throwable) {
                        return;
                    }
                    $q->where(function ($qq) use ($d) {
                        $qq->whereNotNull('paid_at')->whereDate('paid_at', '<=', $d)
                            ->orWhere(function ($q2) use ($d) {
                                $q2->whereNull('paid_at')->whereDate('created_at', '<=', $d);
                            });
                    });
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<Payment> $page */
        $page = $this->applyTable($query, $request, $options);

        $mapped = $page->getCollection()->map(function (Payment $p) {
            $invoice  = $p->invoice;
            $contract = $invoice?->contract;
            $tenant   = $contract?->tenant;

            return [
                'id'         => (string) $p->id,
                'method'     => (string) $p->method->value,
                'status'     => (string) $p->status->value,
                'amount_idr' => (int) $p->amount_idr,
                'paid_at'    => $p->paid_at?->toDateTimeString(),
                'invoice'    => $invoice?->number,
                'tenant'     => $tenant?->name,
            ];
        });

        $page->setCollection($mapped);
        $payload = $this->tablePaginate($page);

        // Load manual bank accounts for admin manual transfer input
        $manualBanks = AppSetting::config('payments.manual_bank_accounts', []);

        $invoiceCandidates = Invoice::query()
            ->with(['contract:id,user_id,room_id', 'contract.tenant:id,name', 'contract.room:id,number'])
            ->whereIn('status', [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value])
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function (Invoice $inv) {
                $contract = $inv->contract;
                $tenant   = $contract?->tenant;
                $room     = $contract?->room;

                try {
                    $totals      = $this->invoices->totals($inv);
                    $outstanding = (int) ($inv->outstanding_idr ?? $totals['outstanding'] ?? 0);
                } catch (\Throwable $e) {
                    $outstanding = (int) ($inv->outstanding_idr ?? 0);
                }

                return [
                    'id'          => (string) $inv->id,
                    'number'      => (string) $inv->number,
                    'tenant'      => $tenant?->name,
                    'room_number' => $room?->number,
                    'status'      => (string) $inv->status->value,
                    'amount_idr'  => (int) $inv->amount_idr,
                    'outstanding' => max(0, (int) $outstanding),
                ];
            });

        // Summary (filtered)
        $sumBase = Payment::query();
        $this->applyRequestFilters($sumBase, $request);
        $totalItems   = (int) $sumBase->count('id');
        $sumAll       = (int) (clone $sumBase)->sum('amount_idr');
        $sumCompleted = (int) (clone $sumBase)->where('status', PaymentStatus::COMPLETED->value)->sum('amount_idr');

        return Inertia::render('management/payments/index', [
            'payments' => $payload,
            'filters'  => [
                'status' => $request->query('status'),
                'method' => $request->query('method'),
                'start'  => $request->query('start'),
                'end'    => $request->query('end'),
            ],
            'options' => [
                'methods'  => PaymentMethod::options(true),
                'statuses' => array_map(fn ($c) => $c->value, PaymentStatus::cases()),
            ],
            'invoiceCandidates' => $invoiceCandidates,
            'paymentsExtra'     => [
                'manual_banks' => is_array($manualBanks) ? array_values($manualBanks) : [],
            ],
            'summary' => [
                'count'         => $totalItems,
                'sum_all'       => $sumAll,
                'sum_completed' => $sumCompleted,
            ],
            'query' => [
                'page'    => $payload['current_page'],
                'perPage' => $payload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
                'status'  => $request->query('status'),
                'method'  => $request->query('method'),
                'start'   => $request->query('start'),
                'end'     => $request->query('end'),
            ],
        ]);
    }

    /** Apply common request filters for payments to a query. */
    protected function applyRequestFilters(Builder $q, Request $request): void
    {
        $status = (string) $request->query('status', '');
        $method = (string) $request->query('method', '');
        $start  = $request->query('start');
        $end    = $request->query('end');

        if ($status !== '') {
            $q->where('status', $status);
        }
        if ($method !== '') {
            $q->where('method', $method);
        }
        if ($start) {
            try {
                $d = Carbon::createFromFormat('Y-m-d', (string) $start)->startOfDay()->toDateString();
                $q->where(function ($qq) use ($d) {
                    $qq->whereNotNull('paid_at')->whereDate('paid_at', '>=', $d)
                        ->orWhere(function ($q2) use ($d) {
                            $q2->whereNull('paid_at')->whereDate('created_at', '>=', $d);
                        });
                });
            } catch (\Throwable) {
                // ignore invalid start
            }
        }
        if ($end) {
            try {
                $d = Carbon::createFromFormat('Y-m-d', (string) $end)->endOfDay()->toDateString();
                $q->where(function ($qq) use ($d) {
                    $qq->whereNotNull('paid_at')->whereDate('paid_at', '<=', $d)
                        ->orWhere(function ($q2) use ($d) {
                            $q2->whereNull('paid_at')->whereDate('created_at', '<=', $d);
                        });
                });
            } catch (\Throwable) {
                // ignore invalid end
            }
        }
    }

    /** Export payments as CSV using current filters. */
    public function export(Request $request)
    {
        $q = Payment::query()
            ->with(['invoice:id,number,contract_id', 'invoice.contract:id,user_id,room_id', 'invoice.contract.tenant:id,name']);
        $this->applyRequestFilters($q, $request);
        $q->orderByDesc('paid_at')->orderByDesc('id');

        $filename = 'payments_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($q): void {
            $out = fopen('php://output', 'w');
            // Header
            fputcsv($out, ['Paid At', 'Created At', 'Method', 'Status', 'Amount (IDR)', 'Invoice', 'Tenant']);
            $q->chunk(1000, function ($rows) use ($out) {
                foreach ($rows as $p) {
                    /** @var Payment $p */
                    $inv    = $p->invoice;
                    $tenant = $inv?->contract?->tenant;
                    fputcsv($out, [
                        $p->paid_at?->toDateTimeString(),
                        $p->created_at?->toDateTimeString(),
                        (string) $p->method->value,
                        (string) $p->status->value,
                        (int) $p->amount_idr,
                        $inv?->number,
                        $tenant?->name,
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

    public function store(StorePaymentRequest $request)
    {
        $data    = $request->validated();
        $invoice = Invoice::findOrFail($data['invoice_id']);

        $totals      = $this->invoices->totals($invoice);
        $outstanding = (int) $totals['outstanding'];

        if ($outstanding <= 0) {
            return back()->with('error', __('management/payments.invoice_already_paid'));
        }
        if ((int) $data['amount_idr'] <= 0) {
            return back()->with('error', __('management/payments.amount_positive'));
        }
        if ((int) $data['amount_idr'] > $outstanding) {
            return back()->with('error', __('management/payments.amount_exceeds_outstanding'));
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
                'invoice_id' => (string) $invoice->getAttribute('id'),
                'method'     => (string) $payment->method->value,
                'status'     => (string) $payment->status->value,
                'amount_idr' => (int) $payment->amount_idr,
            ],
        );

        return back()->with('success', __('management/payments.created'));
    }

    public function void(PaymentVoidRequest $request, Payment $payment)
    {
        $request->validated();
        if ($payment->status === PaymentStatus::CANCELLED) {
            return back()->with('success', __('management/payments.void.already'));
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

        return back()->with('success', __('management/payments.void.success'));
    }

    public function show(Request $request, Payment $payment)
    {
        $payment->load([
            'invoice:id,number,contract_id,amount_idr,due_date,status,paid_at',
            'invoice.contract:id,user_id,room_id,start_date,end_date,status',
            'invoice.contract.tenant:id,name,email,phone',
            'invoice.contract.room:id,number,name',
        ]);

        if ($request->wantsJson()) {
            $inv      = $payment->invoice;
            $contract = $inv?->contract;
            $tenant   = $contract?->tenant;
            $room     = $contract?->room;

            // Prefer trait-based attachments
            $attachments     = $payment->getAttachments('private');
            $firstAttachment = !empty($attachments) ? (string) $attachments[0] : '';

            return response()->json([
                'payment' => [
                    'id'                     => (string) $payment->id,
                    'method'                 => (string) $payment->method->value,
                    'status'                 => (string) $payment->status->value,
                    'amount_idr'             => (int) $payment->amount_idr,
                    'paid_at'                => $payment->paid_at?->toDateTimeString(),
                    'reference'              => $payment->reference,
                    'provider'               => $payment->provider,
                    'note'                   => $payment->note,
                    'recorded_by'            => (string) ($payment->meta['recorded_by'] ?? ''),
                    'attachment'             => $firstAttachment,
                    'attachment_name'        => $firstAttachment ? basename($firstAttachment) : '',
                    'attachment_uploaded_at' => null,
                    'attachments'            => $attachments,
                    'receiver_bank'          => (string) ($payment->meta['receiver']['bank'] ?? ''),
                    'receiver_account'       => (string) ($payment->meta['receiver']['account'] ?? ''),
                    'receiver_holder'        => (string) ($payment->meta['receiver']['holder'] ?? ''),
                    'pre_outstanding_idr'    => (int) ($payment->pre_outstanding_idr ?? 0),
                ],
                'invoice' => $inv ? [
                    'id'         => (string) $inv->getAttribute('id'),
                    'number'     => (string) $inv->getAttribute('number'),
                    'amount_idr' => (int) $inv->getAttribute('amount_idr'),
                    'due_date'   => $inv->due_date ? $inv->due_date->toDateString() : null,
                    'status'     => (string) $inv->status->value,
                    'paid_at'    => $inv->paid_at?->toDateTimeString(),
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
        $payment->load(['invoice:id,number,contract_id,amount_idr', 'invoice.contract:id,user_id,room_id,start_date,end_date', 'invoice.contract.tenant:id,name,email,phone', 'invoice.contract.room:id,number,name']);

        // Resolve first attachment via trait (if any)
        $list            = $payment->getAttachments('private');
        $firstAttachment = !empty($list) ? (string) $list[0] : '';

        $dto = [
            'id'         => (string) $payment->id,
            'method'     => (string) $payment->method->value,
            'status'     => (string) $payment->status->value,
            'amount_idr' => (int) $payment->amount_idr,
            'paid_at'    => $payment->paid_at?->toDateTimeString(),
            'reference'  => $payment->reference,
            'note'       => $payment->note,
            'attachment' => $firstAttachment,
        ];

        $invoice  = $payment->invoice;
        $contract = $invoice?->contract;
        $tenant   = $contract?->tenant;
        $room     = $contract?->room;

        $items        = $invoice ? (array) ($invoice->items ?? []) : [];
        $totalInvoice = $invoice ? (int) $invoice->amount_idr : 0;
        $currentPaid  = (int) $payment->amount_idr;

        if ($invoice) {
            $preOutstanding = $payment->pre_outstanding_idr;
            if ($preOutstanding === null) {
                $query = $invoice->payments()->where('status', PaymentStatus::COMPLETED->value);
                if ($payment->paid_at) {
                    $query->where('paid_at', '<', $payment->paid_at);
                } else {
                    $query->where('id', '<', $payment->id);
                }
                $paidBefore     = (int) $query->sum('amount_idr');
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
                'number'     => (string) $invoice->getAttribute('number'),
                'amount_idr' => $totalInvoice,
                'items'      => $items,
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

    public function attachment(Request $request, Payment $payment)
    {
        // Resolve from trait first
        $bucket = 'private';
        $paths  = $payment->getAttachments($bucket);
        $index  = (int) $request->query('i', 0);
        $path   = '';
        if (!empty($paths)) {
            $idx  = max(0, min(count($paths) - 1, $index));
            $path = (string) $paths[$idx];
        } else {
            $path = (string) ($payment->meta['evidence_path'] ?? '');
        }
        if (!$path) {
            abort(404);
        }
        $resolved = $payment->resolveAttachmentPath($path, $bucket);
        $disk     = $payment->attachmentDiskName($bucket);
        /** @var \Illuminate\Filesystem\FilesystemAdapter $storage */
        $storage = Storage::disk($disk);
        if (!$storage->exists($resolved)) {
            abort(404);
        }

        $absolute = $storage->path($resolved);
        try {
            return response()->file($absolute);
        } catch (\Throwable $e) {
            $content = $storage->get($resolved);
            $mime    = $storage->mimeType($resolved) ?: 'application/octet-stream';

            return response($content, 200, [
                'Content-Type'        => $mime,
                'Content-Disposition' => 'inline',
            ]);
        }
    }

    public function ack(PaymentAckRequest $request, Payment $payment)
    {
        $request->validated();

        if (
            !in_array($payment->status->value, [PaymentStatus::REVIEW->value, PaymentStatus::PENDING->value], true)
            || (string) $payment->method->value !== PaymentMethod::TRANSFER->value
        ) {
            return back()->with('error', __('management/payments.ack.invalid_state'));
        }
        // No admin attachments during review per latest requirements

        $meta = (array) ($payment->meta ?? []);
        if ($request->boolean('ack')) {
            // Confirm
            $meta['review'] = array_merge((array) ($meta['review'] ?? []), [
                'confirmed_at' => now()->toDateTimeString(),
                'confirmed_by' => $request->user()?->name,
            ]);
            if ($request->filled('note')) {
                $payment->note = (string) $request->string('note');
            }
            $payment->status = PaymentStatus::COMPLETED;
            $paidAtStr       = (string) $request->input('paid_at', '');
            $paidAt          = null;
            if ($paidAtStr !== '') {
                try {
                    $paidAt = Carbon::parse($paidAtStr);
                } catch (\Throwable) {
                    $paidAt = null;
                }
            }
            $payment->paid_at = $paidAt ?: ($payment->paid_at ?: now());
            $payment->meta    = $meta;
            $payment->save();

            $inv = $payment->relationLoaded('invoice') ? $payment->invoice : $payment->invoice()->first();
            if ($inv instanceof \App\Models\Invoice) {
                $this->payments->recalculateInvoice($inv);
            }

            return back()->with('success', __('management/payments.ack.confirmed'));
        }

        // Reject path requires reason
        $reason         = (string) $request->string('reason');
        $meta['review'] = array_merge((array) ($meta['review'] ?? []), [
            'rejected_at' => now()->toDateTimeString(),
            'rejected_by' => $request->user()?->name,
            'reason'      => $reason,
        ]);
        $payment->update([
            'status' => PaymentStatus::REJECTED->value,
            'meta'   => $meta,
        ]);

        return back()->with('success', __('management/payments.ack.rejected'));
    }
}
