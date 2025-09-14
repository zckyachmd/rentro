<?php

namespace App\Services;

use App\Enum\InvoiceStatus;
use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Events\InvoicePaid;
use App\Events\InvoiceReopened;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    /**
     * Create a payment for the given invoice and recalculate invoice status/outstanding.
     * Handles evidence upload and safe updates in a transaction.
     *
     * @param array $data Validated payload
     */
    public function createPayment(Invoice $invoice, array $data, ?User $user = null, ?UploadedFile $attachment = null): Payment
    {
        return DB::transaction(function () use ($invoice, $data, $user, $attachment): Payment {
            $method = (string) $data['method'];
            $status = in_array($method, [PaymentMethod::CASH->value, PaymentMethod::TRANSFER->value], true)
                ? PaymentStatus::COMPLETED->value
                : ($data['status'] ?? PaymentStatus::PENDING->value);

            $provider = $data['provider'] ?? null;
            if ($method === PaymentMethod::CASH->value && empty($provider)) {
                $provider = 'Kasir';
            }

            $meta = (array) ($data['meta'] ?? []);

            // Compute current outstanding just before creating this payment
            $totalPaid = (int) $invoice->payments()
                ->where('status', PaymentStatus::COMPLETED->value)
                ->sum('amount_cents');
            $preOutstanding = max(0, (int) $invoice->amount_cents - $totalPaid);

            if ($user) {
                $meta['recorded_by'] = $meta['recorded_by'] ?? $user->name;

                $roles = (array) $user->getRoleNames()->all();
                if (!empty($roles)) {
                    $meta['recorded_by_roles'] = array_values($roles);
                    $meta['recorded_by_role']  = $roles[0];
                }
            }

            $payment = Payment::create([
                'invoice_id'            => $invoice->id,
                'method'                => $method,
                'status'                => $status,
                'amount_cents'          => (int) $data['amount_cents'],
                'pre_outstanding_cents' => $preOutstanding,
                'paid_at'               => $data['paid_at'] ?? ($status === PaymentStatus::COMPLETED->value ? now() : null),
                'reference'             => $data['reference'] ?? null,
                'provider'              => $provider,
                'va_number'             => $data['va_number'] ?? null,
                'va_expired_at'         => $data['va_expired_at'] ?? null,
                'meta'                  => $meta ?: null,
                'note'                  => $data['note'] ?? null,
            ]);

            if ($attachment) {
                $path    = $attachment->store("payments/{$payment->id}");
                $metaNow = array_merge($payment->meta ?? [], [
                    'evidence_path'        => $path,
                    'evidence_uploaded_at' => now()->toDateTimeString(),
                ]);
                $payment->update(['meta' => $metaNow]);
            }

            $this->recalculateInvoice($invoice);

            $invoice->refresh();
            if ($invoice->status === InvoiceStatus::PAID && $payment->status !== PaymentStatus::COMPLETED) {
                $payment->update([
                    'status'  => PaymentStatus::COMPLETED->value,
                    'paid_at' => $payment->paid_at ?: now(),
                ]);
            }

            return $payment;
        });
    }

    /**
     * Void a payment and recalculate its invoice.
     */
    public function voidPayment(Payment $payment, ?string $reason, ?User $user = null): void
    {
        DB::transaction(function () use ($payment, $reason, $user): void {
            /** @var Invoice|null $invoice */
            $invoice = $payment->invoice()->lockForUpdate()->first();

            $meta                = (array) ($payment->meta ?? []);
            $meta['voided_at']   = now()->toDateTimeString();
            $meta['void_reason'] = (string) ($reason ?? '');
            $meta['voided_by']   = $user?->name;

            $payment->update([
                'status' => PaymentStatus::CANCELLED->value,
                'meta'   => $meta,
            ]);

            if ($invoice) {
                $this->recalculateInvoice($invoice);
            }
        });
    }

    /**
     * Recalculate invoice outstanding and status based on completed payments.
     */
    public function recalculateInvoice(Invoice $invoice): void
    {
        $invoice->refresh();
        $prevStatus = (string) $invoice->status->value;

        $totalPaid = (int) $invoice->payments()
            ->where('status', PaymentStatus::COMPLETED->value)
            ->sum('amount_cents');

        $remaining = max(0, (int) $invoice->amount_cents - $totalPaid);

        if ($remaining <= 0) {
            $latestPaidAt = $invoice->payments()
                ->where('status', PaymentStatus::COMPLETED->value)
                ->orderByDesc('paid_at')
                ->value('paid_at');
            $invoice->forceFill([
                'status'            => InvoiceStatus::PAID,
                'paid_at'           => $latestPaidAt ?: now(),
                'outstanding_cents' => 0,
            ])->save();

            if ($prevStatus !== InvoiceStatus::PAID->value) {
                event(new InvoicePaid($invoice));
            }
        } else {
            if ($invoice->status->value !== InvoiceStatus::CANCELLED->value) {
                $due   = $invoice->due_date instanceof Carbon ? $invoice->due_date->copy()->startOfDay() : Carbon::parse((string) $invoice->due_date);
                $today = Carbon::now()->startOfDay();
                $new   = $due->lessThan($today) ? InvoiceStatus::OVERDUE : InvoiceStatus::PENDING;

                $invoice->forceFill([
                    'status'            => $new,
                    'paid_at'           => null,
                    'outstanding_cents' => $remaining,
                ])->save();

                // Fire reopened event when transitioning away from PAID
                if ($prevStatus === InvoiceStatus::PAID->value) {
                    event(new InvoiceReopened($invoice));
                }
            }
        }
    }

    /**
     * Void all pending payments for an invoice, optionally filtered by provider,
     * in a single transaction and recalculate the invoice once.
     * Returns number of payments voided.
     */
    public function voidPendingPaymentsForInvoice(Invoice $invoice, ?string $provider = null, ?string $reason = null, ?User $user = null): int
    {
        return DB::transaction(function () use ($invoice, $provider, $reason, $user): int {
            $query = $invoice->payments()
                ->where('status', PaymentStatus::PENDING->value);
            if (!empty($provider)) {
                $query->where('provider', $provider);
            }

            $payments = $query->lockForUpdate()->get();
            if ($payments->isEmpty()) {
                return 0;
            }

            foreach ($payments as $payment) {
                $meta                = (array) ($payment->meta ?? []);
                $meta['voided_at']   = now()->toDateTimeString();
                $meta['void_reason'] = (string) ($reason ?? '');
                $meta['voided_by']   = $user?->name;

                $payment->update([
                    'status' => PaymentStatus::CANCELLED->value,
                    'meta'   => $meta,
                ]);
            }

            $this->recalculateInvoice($invoice);

            return $payments->count();
        });
    }
}
