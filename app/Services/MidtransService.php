<?php

declare(strict_types=1);

namespace App\Services;

use App\Enum\MidtransBank;
use App\Enum\PaymentStatus;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Midtrans\Contracts\MidtransGatewayInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\CoreApi;
use Midtrans\Transaction;

/**
 * MidtransService.
 *
 * - Initializes SDK config (server key, environment, HTTP options)
 * - Issues Core API charges for Bank Transfer VA
 * - Verifies webhook signatures and maps Midtrans status to internal status
 *
 * Hardening:
 * - Validates configuration and inputs
 * - Normalizes SDK responses to arrays (avoid stdClass access issues)
 * - Optional custom expiry (config: midtrans.expiry_minutes)
 * - Single retry on order_id conflict with regenerated suffix
 */
class MidtransService implements MidtransGatewayInterface
{
    /**
     * Initialize Midtrans SDK config once per request.
     */
    public function boot(): void
    {
        Config::$serverKey    = (string) config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production', false);

        $timeouts            = (array) config('midtrans.timeouts', []);
        Config::$curlOptions = [
            CURLOPT_CONNECTTIMEOUT => (int) ($timeouts['connect'] ?? 10),
            CURLOPT_TIMEOUT        => (int) ($timeouts['total'] ?? 30),
            CURLOPT_HTTPHEADER     => [],
        ];
    }

    /**
     * Create a Core API Bank Transfer VA charge (bca|bni|bri|permata|cimb).
     */
    public function createVa(Invoice $invoice, Payment $payment, int $amountIdr, string $bank, array $customer = []): array
    {
        $this->boot();

        $this->ensureConfigured();
        $bank = self::assertBank($bank);
        if ($amountIdr <= 0) {
            throw new \InvalidArgumentException(__('management/payments.invalid_amount'));
        }

        $invoice->loadMissing(['contract.room:id,number']);
        $orderId     = (string) ($payment->reference ?: $invoice->number ?: ('PAY-' . now()->format('Ymd') . '-XXXX'));
        $gross       = (int) number_format($amountIdr, 0, '.', '');
        $itemDetails = $this->buildItemDetails($invoice, $gross);

        $params = [
            'payment_type'        => 'bank_transfer',
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => (int) $gross,
            ],
            'item_details'     => $itemDetails,
            'customer_details' => [
                'first_name' => (string) Arr::get($customer, 'name', ''),
                'email'      => (string) Arr::get($customer, 'email', ''),
                'phone'      => (string) Arr::get($customer, 'phone', ''),
            ],
            'bank_transfer' => [
                'bank' => $bank,
            ],
        ];

        $expiry = (int) (config('midtrans.expiry_minutes') ?? 0);
        if ($expiry > 0) {
            $params['custom_expiry'] = [
                'expiry_duration' => $expiry,
                'unit'            => 'minute',
            ];
        }

        $respArr = $this->chargeWithRetry($params, $orderId, 'bank_transfer');

        $vaNumber   = null;
        $expiryTime = null;
        if (!empty($respArr['va_numbers']) && is_array($respArr['va_numbers'])) {
            $first    = $respArr['va_numbers'][0] ?? [];
            $vaNumber = is_array($first) ? ($first['va_number'] ?? null) : null;
        } elseif (!empty($respArr['permata_va_number'])) {
            $vaNumber = (string) $respArr['permata_va_number'];
        }
        if (!empty($respArr['expiry_time'])) {
            $expiryTime = (string) $respArr['expiry_time'];
        }

        return [
            'order_id'     => (string) $orderId,
            'payment_type' => 'bank_transfer',
            'bank'         => strtolower($bank),
            'va_number'    => $vaNumber ? (string) $vaNumber : null,
            'expiry_time'  => $expiryTime,
            'additional'   => [
                'params' => $params,
                'raw'    => $respArr,
            ],
        ];
    }

    /** Normalize SDK responses into arrays (handles stdClass). */
    private function arrify(mixed $resp): array
    {
        return is_array($resp) ? $resp : (array) json_decode(json_encode($resp), true);
    }

    /** Ensure server key is configured */
    private function ensureConfigured(): void
    {
        if (!Config::$serverKey) {
            throw new \RuntimeException(__('management/payments.server_key_missing'));
        }
    }

    /** Validate and normalize bank code */
    private static function assertBank(string $bank): string
    {
        return MidtransBank::normalize($bank);
    }

    /** Sanitize item name/label (length & characters) */
    private function sanitizeLabel(string $label): string
    {
        $label = (string) preg_replace('/\s+/', ' ', $label);
        $label = trim($label);
        if ($label === '') {
            $label = 'Item';
        }

        return mb_substr($label, 0, 50);
    }

    /** Sanitize item id */
    private function sanitizeId(string $id): string
    {
        $id = (string) preg_replace('/[^A-Za-z0-9\-_.]/', '', $id);

        return mb_substr($id, 0, 40);
    }

    /**
     * Perform Core API charge with a single retry on order_id conflict.
     * @param array $params
     * @param string $orderId
     * @param string $kind 'bank_transfer'
     * @return array
     */
    private function chargeWithRetry(array $params, string $orderId, string $kind): array
    {
        try {
            $resp = CoreApi::charge($params);

            return $this->arrify($resp);
        } catch (\Throwable $e) {
            $msg        = (string) $e->getMessage();
            $isConflict = (
                stripos($msg, 'order_id') !== false && stripos($msg, 'used') !== false
            ) || (
                stripos($msg, 'status code: 406') !== false
            ) || (
                stripos($msg, 'status_code') !== false && stripos($msg, '406') !== false
            ) || (
                stripos($msg, 'conflict') !== false
            );
            if ($isConflict) {
                $newId                                     = $orderId . '-R' . substr(bin2hex(random_bytes(3)), 0, 6);
                $params['transaction_details']['order_id'] = $newId;
                Log::warning('Midtrans order_id conflict. Retrying with new id.', [
                    'kind'     => $kind,
                    'order_id' => $orderId,
                    'new_id'   => $newId,
                ]);
                $resp            = CoreApi::charge($params);
                $arr             = $this->arrify($resp);
                $arr['order_id'] = $arr['order_id'] ?? $newId;

                return $arr;
            }
            Log::error('Midtrans charge failed', [
                'kind'     => $kind,
                'order_id' => $orderId,
                'error'    => $msg,
            ]);
            throw $e;
        }
    }

    /**
     * Convert internal invoice items into Midtrans item_details.
     * Falls back to single-line details when no items present.
     * @return array<int, array{id:string,price:int,quantity:int,name:string}>
     */
    private function buildItemDetails(Invoice $invoice, int $gross): array
    {
        $itemDetails = [];
        $items       = (array) ($invoice->items ?? []);
        if (!empty($items)) {
            foreach ($items as $idx => $it) {
                $label  = $this->sanitizeLabel((string) ($it['label'] ?? ('Item ' . ($idx + 1))));
                $amount = (int) ($it['amount_idr'] ?? 0);
                $meta   = (array) ($it['meta'] ?? []);
                $qty    = (int) ($meta['qty'] ?? 1);
                $unit   = (int) ($meta['unit_price_idr'] ?? 0);

                if ($qty > 0 && $unit > 0) {
                    $price    = $unit;
                    $quantity = $qty;
                } else {
                    $price    = $amount;
                    $quantity = 1;
                }

                $itemDetails[] = [
                    'id'       => $this->sanitizeId((string) ($it['code'] ?? ($invoice->id . '-' . ($idx + 1)))),
                    'price'    => (int) $price,
                    'quantity' => (int) $quantity,
                    'name'     => $label,
                ];
            }
        }
        if (empty($itemDetails)) {
            $itemDetails[] = [
                'id'       => $this->sanitizeId((string) $invoice->id),
                'price'    => (int) $gross,
                'quantity' => 1,
                'name'     => $this->sanitizeLabel('Invoice ' . ($invoice->number ?? $invoice->id)),
            ];
        }

        $sum = 0;
        foreach ($itemDetails as $d) {
            $sum += ((int) $d['price']) * ((int) $d['quantity']);
        }
        if ($sum !== $gross) {
            $delta         = $gross - $sum;
            $itemDetails[] = [
                'id'       => $this->sanitizeId((string) $invoice->id . '-ADJ'),
                'price'    => (int) $delta,
                'quantity' => 1,
                'name'     => $this->sanitizeLabel('Penyesuaian'),
            ];
        }

        return $itemDetails;
    }

    /**
     * Verify Midtrans notification signature.
     */
    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool
    {
        $serverKey = (string) config('midtrans.server_key');
        $payload   = $orderId . $statusCode . $grossAmount . $serverKey;
        $expected  = hash('sha512', $payload);

        return hash_equals($expected, $signatureKey);
    }

    /**
     * Map Midtrans transaction status to internal Payment status.
     * Returns [status, paidAt|null].
     *
     * @return array{status:string, paid_at: string|null}
     */
    public function mapStatus(array $notif): array
    {
        $trx   = (string) ($notif['transaction_status'] ?? '');
        $fraud = (string) ($notif['fraud_status'] ?? '');

        // Default
        $status = PaymentStatus::PENDING->value;
        $paidAt = null;

        if (in_array($trx, ['settlement', 'capture'], true) && $fraud !== 'challenge') {
            $status = PaymentStatus::COMPLETED->value;
            $paidAt = (string) ($notif['settlement_time'] ?? ($notif['transaction_time'] ?? null));
        } elseif ($trx === 'pending') {
            $status = PaymentStatus::PENDING->value;
        } elseif (in_array($trx, ['deny', 'cancel', 'expire', 'failure'], true)) {
            $status = $trx === 'cancel' ? PaymentStatus::CANCELLED->value : PaymentStatus::FAILED->value;
        }

        return ['status' => $status, 'paid_at' => $paidAt];
    }

    /** Fetch transaction status from Midtrans by order_id. */
    public function fetchTransactionStatus(string $orderId): array
    {
        $this->boot();
        $this->ensureConfigured();
        $resp = Transaction::status($orderId);

        return $this->arrify($resp);
    }

    /**
     * Extract lightweight "pending info" for frontend from a Payment's Midtrans meta.
     * Returns null when payment is null.
     *
     * @return array<string, mixed>|null
     */
    public function extractPendingInfoFromPayment(?Payment $pendingPayment): ?array
    {
        if (!$pendingPayment) {
            return null;
        }

        $mid   = (array) ($pendingPayment->meta['midtrans'] ?? []);
        $notif = (array) ($mid['last_notification'] ?? []);
        $instr = (array) ($mid['instructions'] ?? []);

        $bank      = null;
        $va        = null;
        $vaNumbers = $notif['va_numbers'] ?? [];
        if (is_array($vaNumbers) && !empty($vaNumbers)) {
            $first = $vaNumbers[0] ?? [];
            if (is_array($first)) {
                $bank = $first['bank'] ?? null;
                $va   = $first['va_number'] ?? null;
            }
        } elseif (!empty($notif['permata_va_number'])) {
            $bank = 'permata';
            $va   = $notif['permata_va_number'];
        }

        if ($bank === null && !empty($instr['bank'])) {
            $bank = (string) $instr['bank'];
        }

        return [
            'payment_type' => (string) ($instr['payment_type'] ?? ($notif['payment_type'] ?? '')),
            'bank'         => $bank,
            'va_number'    => $va ?: (string) ($pendingPayment->va_number ?? ''),
            'expiry_time'  => (string) ($notif['expiry_time'] ?? ($pendingPayment->va_expired_at ? $pendingPayment->va_expired_at->toDateTimeString() : '')),
            'pdf_url'      => (string) ($instr['pdf_url'] ?? ($notif['pdf_url'] ?? '')),
            'payment_code' => (string) ($instr['payment_code'] ?? ($notif['payment_code'] ?? '')),
            'store'        => (string) ($instr['store'] ?? ($notif['store'] ?? '')),
            'qr_string'    => (string) ($instr['qr_string'] ?? ($notif['qr_string'] ?? '')),
            'actions'      => $instr['actions'] ?? ($notif['actions'] ?? []),
        ];
    }

    /** @inheritDoc */
    public function extractVaFieldsFromPayload(array $payload): array
    {
        $vaNumber = null;
        $expiry   = null;

        $vaNumbers = $payload['va_numbers'] ?? $payload['va_number'] ?? [];
        if (is_array($vaNumbers) && !empty($vaNumbers)) {
            $first = $vaNumbers[0] ?? [];
            if (is_array($first)) {
                $vaNumber = (string) ($first['va_number'] ?? '');
            }
        } elseif (is_string($vaNumbers) && $vaNumbers !== '') {
            $vaNumber = (string) $vaNumbers;
        } elseif (!empty($payload['permata_va_number'])) {
            $vaNumber = (string) $payload['permata_va_number'];
        }

        if (!empty($payload['expiry_time'])) {
            $expiry = (string) $payload['expiry_time'];
        }

        return [
            'va_number'   => $vaNumber ?: null,
            'expiry_time' => $expiry,
        ];
    }

    /** @inheritDoc */
    public function extractInstructionMetaFromPayload(array $payload): array
    {
        $instructions = [
            'payment_type' => $payload['payment_type'] ?? null,
            'pdf_url'      => $payload['pdf_url'] ?? null,
            'payment_code' => $payload['payment_code'] ?? null,
            'store'        => $payload['store'] ?? null,
            'qr_string'    => $payload['qr_string'] ?? null,
            'actions'      => $payload['actions'] ?? null,
        ];

        return array_filter($instructions, fn ($v) => $v !== null);
    }

    /** @inheritDoc */
    public function expireTransaction(string $orderId): bool
    {
        try {
            if (trim($orderId) === '') {
                return false;
            }
            $this->boot();
            $this->ensureConfigured();

            $resp = Transaction::expire($orderId);
            $this->arrify($resp);

            return true;
        } catch (\Throwable $e) {
            Log::warning('Midtrans expire failed', [
                'order_id' => $orderId,
                'error'    => $e->getMessage(),
            ]);

            return false;
        }
    }
}
