<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Services\Contracts\MidtransGatewayInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class SyncMidtransPayment implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $paymentId)
    {
        $this->onQueue('payments');
    }

    public function handle(MidtransGatewayInterface $midtrans, PaymentServiceInterface $payments, NotificationServiceInterface $notifications): void
    {
        $payment = Payment::query()->with(['invoice.contract:id,user_id'])->find($this->paymentId);
        if (!$payment) {
            return;
        }
        $oldStatus = (string) $payment->status->value;

        // Global rate limiter key (shared across workers / processes)
        $key     = 'midtrans:poll:global';
        $allowed = RateLimiter::attempt($key, $maxAttempts = 30, function () {
            // just reserving a slot, actual work runs below
        }, $decaySeconds = 60);

        if (!$allowed) {
            $delay = max(5, (int) RateLimiter::availableIn($key));
            $this->release($delay);

            return;
        }

        try {
            $orderId = (string) ($payment->reference ?: (($payment->meta['midtrans']['order_id'] ?? '') ?: ''));
            if ($orderId === '') {
                $orderId = 'PAY-' . $payment->id;
            }

            $raw    = $midtrans->fetchTransactionStatus($orderId);
            $mapped = $midtrans->mapStatus($raw);

            $updates = [
                'status' => $mapped['status'],
            ];

            if (!empty($mapped['paid_at'])) {
                $updates['paid_at'] = $mapped['paid_at'];
            }

            // Capture VA details if present
            $vaNumbers = $raw['va_numbers'] ?? $raw['va_number'] ?? [];
            if (is_array($vaNumbers) && !empty($vaNumbers)) {
                $first = $vaNumbers[0] ?? [];
                if (is_array($first)) {
                    $updates['va_number'] = (string) ($first['va_number'] ?? '');
                }
            } elseif (is_string($vaNumbers) && $vaNumbers !== '') {
                $updates['va_number'] = $vaNumbers;
            }
            if (!empty($raw['expiry_time'])) {
                $updates['va_expired_at'] = $raw['expiry_time'];
            }

            // Merge meta for audit/debug
            $md                = (array) (($payment->meta['midtrans'] ?? []));
            $md['last_poll']   = now()->toDateTimeString();
            $md['last_status'] = $raw;
            $meta              = array_merge($payment->meta ?? [], [
                'midtrans' => $md,
            ]);

            $payment->update(array_merge($updates, ['meta' => $meta]));

            // Recalculate invoice balances & status
            $invModel = $payment->invoice;
            if ($invModel) {
                $payments->recalculateInvoice($invModel);
            }

            // If status changed, notify tenant accordingly
            try {
                $newStatus = (string) $payment->status->value;
                if ($newStatus !== $oldStatus) {
                    $invoice   = $payment->invoice;
                    $tenantId  = 0;
                    $invNumber = '';
                    if ($invoice) {
                        $invNumber = (string) ($invoice->number ?? '');
                        if ($invoice->contract) {
                            $tenantId = (int) $invoice->contract->user_id;
                        }
                    }
                    if ($tenantId > 0) {
                        if ($newStatus === \App\Enum\PaymentStatus::COMPLETED->value) {
                            $title   = ['key' => 'notifications.content.payment.confirmed.title'];
                            $message = [
                                'key'    => 'notifications.content.payment.confirmed.message',
                                'params' => ['invoice' => $invNumber],
                            ];
                            $actionUrl = route('tenant.invoices.payments.show', ['payment' => $payment->id]);
                            $notifications->notifyUser($tenantId, $title, $message, $actionUrl, [
                                'type'       => 'payment',
                                'event'      => 'confirmed',
                                'invoice_id' => $invoice ? (string) $invoice->id : null,
                                'payment_id' => (string) $payment->id,
                                'scope'      => config('notifications.controller.default_scope', 'system'),
                            ]);
                        } elseif (in_array($newStatus, [\App\Enum\PaymentStatus::FAILED->value, \App\Enum\PaymentStatus::REJECTED->value], true)) {
                            $title   = ['key' => 'notifications.content.payment.rejected.title'];
                            $message = [
                                'key'    => 'notifications.content.payment.rejected.message',
                                'params' => ['invoice' => $invNumber],
                            ];
                            $actionUrl = route('tenant.invoices.payments.show', ['payment' => $payment->id]);
                            $notifications->notifyUser($tenantId, $title, $message, $actionUrl, [
                                'type'       => 'payment',
                                'event'      => 'rejected',
                                'invoice_id' => $invoice ? (string) $invoice->id : null,
                                'payment_id' => (string) $payment->id,
                                'scope'      => config('notifications.controller.default_scope', 'system'),
                            ]);
                        }
                    }
                }
            } catch (\Throwable) {
            }
        } catch (\Throwable $e) {
            Log::warning('SyncMidtransPayment failed', [
                'payment_id' => (string) $this->paymentId,
                'error'      => $e->getMessage(),
            ]);

            // Let Horizon control retries/backoff globally
            throw $e;
        }
    }

    public function tags(): array
    {
        return ['payments', 'midtrans:poll', 'payment:' . $this->paymentId];
    }
}
