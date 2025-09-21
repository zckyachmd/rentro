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
use App\Services\Contracts\InvoiceServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class PaymentService implements PaymentServiceInterface
{
    public function __construct(private readonly InvoiceServiceInterface $invoices)
    {
    }

    private function generatePaymentReference(Invoice $invoice): string
    {
        // Format baru berbasis nomor invoice:
        //  - Ambil nomor invoice (contoh: INV-YYYYMMDD-XXXX)
        //  - Ganti prefix INV- menjadi PAY-
        //  - Tambahkan suffix acak 4 karakter alfanumerik: PAY-YYYYMMDD-XXXX-AB12
        $invNo = (string) ($invoice->number ?? '');
        if ($invNo !== '' && str_starts_with($invNo, 'INV-')) {
            $base = 'PAY-' . substr($invNo, 4);
        } elseif ($invNo !== '' && preg_match('/(\d{8}-\d{4})/', $invNo, $m)) {
            $base = 'PAY-' . $m[1];
        } else {
            // Fallback jika format invoice tidak standar
            $base = 'PAY-' . now()->format('Ymd') . '-' . sprintf('%04d', random_int(0, 9999));
        }

        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $alphaLen = strlen($alphabet);

        // Coba beberapa kali untuk memastikan unik
        for ($i = 0; $i < 20; $i++) {
            $suffix = '';
            for ($j = 0; $j < 4; $j++) {
                $suffix .= $alphabet[random_int(0, $alphaLen - 1)];
            }
            $ref = $base . '-' . $suffix;
            if (!Payment::query()->where('reference', $ref)->exists()) {
                return $ref;
            }
        }

        // Fallback terakhir dengan timestamp detik + 2 digit acak
        $suffix = substr(strtoupper(bin2hex(random_bytes(2))), 0, 4);
        $ref    = $base . '-' . $suffix;

        return $ref;
    }

    /**
     * Create a payment for the given invoice and recalculate invoice status/outstanding.
     * Handles evidence upload and safe updates in a transaction.
     *
     * @param array $data Validated payload
     */
    public function createPayment(Invoice $invoice, array $data, ?User $user = null, ?UploadedFile $attachment = null): Payment
    {
        return DB::transaction(function () use ($invoice, $data, $user, $attachment): Payment {
            $method   = (string) $data['method'];
            $provider = $data['provider'] ?? null;

            if ($method === PaymentMethod::TRANSFER->value && (string) $provider === 'Manual') {
                $status = PaymentStatus::REVIEW->value;
            } elseif (in_array($method, [PaymentMethod::CASH->value, PaymentMethod::TRANSFER->value], true)) {
                $status = PaymentStatus::COMPLETED->value;
            } else {
                $status = $data['status'] ?? PaymentStatus::PENDING->value;
            }
            if ($method === PaymentMethod::CASH->value && empty($provider)) {
                $provider = 'Kasir';
            }

            $meta = (array) ($data['meta'] ?? []);

            $totals         = $this->invoices->totals($invoice);
            $preOutstanding = (int) $totals['outstanding'];

            if ($user) {
                $meta['recorded_by'] = $meta['recorded_by'] ?? $user->name;

                $roles = (array) $user->getRoleNames()->all();
                if (!empty($roles)) {
                    $meta['recorded_by_roles'] = array_values($roles);
                    $meta['recorded_by_role']  = $roles[0];
                }
            }

            // Determine paid_at policy: set now only for Completed
            $shouldSetPaidNow = ($status === PaymentStatus::COMPLETED->value);

            $payment = Payment::create([
                'invoice_id'            => $invoice->id,
                'method'                => $method,
                'status'                => $status,
                'amount_cents'          => (int) $data['amount_cents'],
                'pre_outstanding_cents' => $preOutstanding,
                'paid_at'               => $data['paid_at'] ?? ($shouldSetPaidNow ? now() : null),
                'reference'             => null,
                'provider'              => $provider,
                'va_number'             => $data['va_number'] ?? null,
                'va_expired_at'         => $data['va_expired_at'] ?? null,
                'meta'                  => $meta ?: null,
                'note'                  => $data['note'] ?? null,
            ]);

            if (empty($payment->reference)) {
                // Set PAY-YYYYMMDD-<4digit>, retry jika bentrok unique
                for ($i = 0; $i < 5; $i++) {
                    $candidate = $this->generatePaymentReference($invoice);
                    try {
                        $payment->update(['reference' => $candidate]);
                        break;
                    } catch (\Throwable $e) {
                        // kemungkinan bentrok unik; coba lagi
                        continue;
                    }
                }
            }

            // Store attachment evidence if provided (private bucket, single file)
            try {
                if ($attachment) {
                    $payment->storeAttachmentFiles([$attachment], 'private', 1);
                }
            } catch (\Throwable $e) {
                // Ignore attachment failures; admin can re-upload
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

        $totals    = $this->invoices->totals($invoice);
        $remaining = (int) $totals['outstanding'];

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
                ->whereIn('status', [PaymentStatus::PENDING->value, PaymentStatus::REVIEW->value]);
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
