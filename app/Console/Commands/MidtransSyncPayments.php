<?php

namespace App\Console\Commands;

use App\Enum\PaymentStatus;
use App\Models\Payment;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Midtrans\Contracts\MidtransGatewayInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MidtransSyncPayments extends Command
{
    protected $signature   = 'payments:midtrans-sync {--limit=200 : Max records to check per run}';
    protected $description = 'Sync pending Midtrans payments by polling transaction status (as a fallback to webhooks).';

    public function __construct(
        private readonly MidtransGatewayInterface $midtrans,
        private readonly PaymentServiceInterface $payments,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $count = 0;

        Payment::query()
            ->where('provider', 'Midtrans')
            ->where('status', PaymentStatus::PENDING->value)
            ->orderBy('id')
            ->limit(max(1, $limit))
            ->get(['id', 'invoice_id', 'reference', 'meta', 'va_number', 'va_expired_at'])
            ->each(function (Payment $payment) use (&$count): void {
                $orderId = (string) ($payment->reference ?: (($payment->meta['midtrans']['order_id'] ?? '') ?: ''));
                if ($orderId === '') {
                    // Best effort fallback to deterministic pattern
                    $orderId = 'PAY-' . $payment->id;
                }

                try {
                    $raw    = $this->midtrans->fetchTransactionStatus($orderId);
                    $mapped = $this->midtrans->mapStatus($raw);

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

                    // Merge meta
                    $md                = (array) (($payment->meta['midtrans'] ?? []));
                    $md['last_poll']   = now()->toDateTimeString();
                    $md['last_status'] = $raw;
                    $meta              = array_merge($payment->meta ?? [], [
                        'midtrans' => $md,
                    ]);

                    $payment->update(array_merge($updates, ['meta' => $meta]));

                    // Recalculate invoice balances & status with explicit typing for PHPStan
                    /** @var \Illuminate\Database\Eloquent\Model|\App\Models\Invoice|null $invModel */
                    $invModel = $payment->invoice;
                    if ($invModel instanceof \App\Models\Invoice) {
                        $this->payments->recalculateInvoice($invModel);
                    }

                    $count++;
                } catch (\Throwable $e) {
                    Log::warning('Midtrans poll failed', [
                        'payment_id' => (string) $payment->id,
                        'order_id'   => $orderId,
                        'error'      => $e->getMessage(),
                    ]);
                }
            });

        $this->info("Synced {$count} payment(s).");

        return self::SUCCESS;
    }
}
