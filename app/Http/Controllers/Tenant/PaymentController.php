<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enum\InvoiceStatus;
use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Enum\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\PayManualRequest;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Contracts\InvoiceServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentServiceInterface $payments,
        private readonly InvoiceServiceInterface $invoices,
        private readonly NotificationServiceInterface $notifications,
    ) {
    }

    private function assertOwnership(Invoice $invoice, Request $request): void
    {
        $invoice->load(['contract:id,user_id']);
        /** @var Contract|null $own */
        $own = $invoice->contract;
        if (!$own || (string) $own->user_id !== (string) $request->user()->id) {
            abort(403);
        }
    }

    public function payManual(PayManualRequest $request, Invoice $invoice): RedirectResponse
    {
        $this->assertOwnership($invoice, $request);
        $validated = $request->validated();

        if (!in_array($invoice->status->value, [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value], true)) {
            return back()->with('error', __('tenant/payment.invoice.cannot_pay_on_status'));
        }

        $totals      = $this->invoices->totals($invoice);
        $outstanding = (int) $totals['outstanding'];
        if ($outstanding <= 0) {
            return back()->with('error', __('tenant/payment.invoice.already_paid'));
        }

        $this->payments->voidPendingPaymentsForInvoice($invoice, 'Manual', 'Resubmitted manual transfer', $request->user());

        $meta = [
            'payment_type' => 'manual',
            'manual'       => [
                'bank' => (string) $validated['bank'],
            ],
            'submitted_by' => (string) $request->user()->name,
        ];

        try {
            $manualBanks = \App\Models\AppSetting::config('payments.manual_bank_accounts', []);
            $chosen      = null;
            foreach ((array) $manualBanks as $b) {
                $code = strtolower((string) ($b['bank'] ?? ''));
                if ($code !== '' && $code === strtolower((string) $validated['bank'])) {
                    $chosen = $b;
                    break;
                }
            }
            if (is_array($chosen)) {
                $meta['receiver'] = [
                    'bank'    => (string) ($chosen['bank'] ?? ''),
                    'holder'  => (string) ($chosen['holder'] ?? ''),
                    'account' => (string) ($chosen['account'] ?? ''),
                ];
            }
        } catch (\Throwable) {
            // ignore
        }

        $payment = $this->payments->createPayment(
            invoice: $invoice,
            data: [
                'method'     => PaymentMethod::TRANSFER->value,
                'status'     => PaymentStatus::REVIEW->value,
                'amount_idr' => $outstanding,
                'provider'   => 'Manual',
                'meta'       => $meta,
                'note'       => (string) ($validated['note'] ?? ''),
                'paid_at'    => (string) $validated['paid_at'],
            ],
            user: $request->user(),
            attachment: null,
        );

        try {
            $file = $request->file('attachment');
            if ($file) {
                $payment->storeAttachmentFiles([$file], 'private');
            }
        } catch (\Throwable $e) {
            // ignore;
        }

        try {
            $roleNames = array_filter(array_map('trim', (array) config('notifications.management_roles.payment_submitted', [RoleName::MANAGER->value])));
            if ($roleNames !== []) {
                $roleIds = Role::query()->whereIn('name', $roleNames)->pluck('id')->map(fn ($id) => (int) $id)->all();
                if (!empty($roleIds)) {
                    $title   = __('notifications.payment.submitted.title');
                    $message = __('notifications.payment.submitted.message', ['invoice' => (string) ($invoice->number ?? '')]);
                    foreach ($roleIds as $rid) {
                        $this->notifications->announceRole($rid, $title, $message, null, false);
                    }
                }
            }
        } catch (\Throwable) {
            // ignore;
        }

        return back()->with('success', __('tenant/payment.proof_submitted'));
    }

    public function show(Request $request, Payment $payment)
    {
        $payment->load(['invoice.contract']);
        $inv = $payment->invoice;
        $ct  = $inv?->contract;
        if (!($ct instanceof Contract) || (string) $ct->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        $meta            = (array) ($payment->meta ?? []);
        $reviewMeta      = (array) ($meta['review'] ?? []);
        $receiver        = (array) ($meta['receiver'] ?? []);
        $attachments     = (array) $payment->getAttachments('private');
        $firstAttachment = !empty($attachments) ? (string) $attachments[0] : '';

        return response()->json([
            'payment' => [
                'id'               => (string) $payment->id,
                'method'           => (string) $payment->method->value,
                'status'           => (string) $payment->status->value,
                'amount_idr'       => (int) $payment->amount_idr,
                'paid_at'          => $payment->paid_at?->toDateTimeString(),
                'reference'        => $payment->reference,
                'note'             => $payment->note,
                'attachments'      => $attachments,
                'attachment'       => $firstAttachment ?: null,
                'receiver_bank'    => isset($receiver['bank']) ? (string) $receiver['bank'] : null,
                'receiver_account' => isset($receiver['account']) ? (string) $receiver['account'] : null,
                'receiver_holder'  => isset($receiver['holder']) ? (string) $receiver['holder'] : null,
                'review_by'        => (string) ($reviewMeta['confirmed_by'] ?? ($reviewMeta['rejected_by'] ?? '')) ?: null,
                'review_at'        => (string) ($reviewMeta['confirmed_at'] ?? ($reviewMeta['rejected_at'] ?? '')) ?: null,
                'reject_reason'    => (string) ($reviewMeta['reason'] ?? '') ?: null,
            ],
            'invoice' => [
                'number'     => (string) ($inv->number ?? ''),
                'amount_idr' => (int) ($inv->amount_idr ?? 0),
            ],
        ]);
    }

    public function attachment(Request $request, Payment $payment)
    {
        $payment->load(['invoice.contract']);
        $ct = $payment->invoice?->contract;
        if (!($ct instanceof Contract) || (string) $ct->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        $bucket = 'private';
        $paths  = (array) $payment->getAttachments($bucket);
        $index  = (int) $request->query('i', 0);
        $path   = '';
        if (!empty($paths)) {
            $idx  = max(0, min(count($paths) - 1, $index));
            $path = (string) $paths[$idx];
        }
        if (!$path) {
            abort(404);
        }
        $resolved = $payment->resolveAttachmentPath($path, $bucket);
        $disk     = $payment->attachmentDiskName($bucket);
        $storage  = Storage::disk($disk);
        if (!$storage->exists($resolved)) {
            abort(404);
        }
        $absolute = $storage->path($resolved);
        try {
            return response()->file($absolute);
        } catch (\Throwable $e) {
            $content = $storage->get($resolved);
            $mime    = $storage->mimeType($resolved) ?: 'application/octet-stream';

            return response($content, 200, ['Content-Type' => $mime, 'Content-Disposition' => 'inline']);
        }
    }
}
