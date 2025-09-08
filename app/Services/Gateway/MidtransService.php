<?php

namespace App\Services\Gateway;

use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Gateway\Contracts\MidtransGatewayInterface;
use Illuminate\Support\Arr;
use Midtrans\Config;

class MidtransService implements MidtransGatewayInterface
{
    /**
     * Initialize Midtrans SDK config once per request.
     */
    public function boot(): void
    {
        Config::$serverKey    = (string) config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production', false);

        // Timeouts & ensure headers slot exists to avoid undefined index when SDK appends headers
        $timeouts            = (array) config('midtrans.timeouts', []);
        Config::$curlOptions = [
            CURLOPT_CONNECTTIMEOUT => (int) ($timeouts['connect'] ?? 10),
            CURLOPT_TIMEOUT        => (int) ($timeouts['total'] ?? 30),
            CURLOPT_HTTPHEADER     => [],
        ];
    }

    /**
     * Create a Snap transaction for a specific invoice payment attempt.
     * Returns array: [order_id, token, redirect_url, additional].
     *
     * @param Invoice $invoice
     * @param Payment $payment Pending payment row related to the invoice
     * @param int $amountCents Amount in smallest unit (e.g. rupiah cents)
     * @param array $customer Optional: ['name' => string, 'email' => string, 'phone' => string]
     * @return array{order_id:string,token:string,redirect_url:string,additional:array}
     */
    public function createSnap(Invoice $invoice, Payment $payment, int $amountCents, array $customer = []): array
    {
        $this->boot();

        // Ensure related room number is available for context in order details
        $invoice->loadMissing(['contract.room:id,number']);
        $roomNo = (string) optional(optional($invoice->contract)->room)->number;

        // Compose order_id with room hint when available (e.g., PAY-123456-RM152)
        $orderId = 'PAY-' . $payment->id;
        if ($roomNo !== '') {
            $sanitized = preg_replace('/[^A-Za-z0-9]/', '', $roomNo) ?: $roomNo;
            $orderId .= '-RM' . $sanitized;
        }
        $gross = (int) number_format($amountCents, 0, '.', ''); // integer IDR without decimals

        // Build item details from invoice items when available
        $itemDetails = [];
        $items       = (array) ($invoice->items ?? []);
        if (!empty($items)) {
            foreach ($items as $idx => $it) {
                $label  = (string) ($it['label'] ?? ('Item ' . ($idx + 1)));
                $amount = (int) ($it['amount_cents'] ?? 0);
                $meta   = (array) ($it['meta'] ?? []);
                $qty    = (int) ($meta['qty'] ?? 1);
                $unit   = (int) ($meta['unit_price_cents'] ?? 0);

                if ($qty > 0 && $unit > 0) {
                    $price    = $unit;
                    $quantity = $qty;
                } else {
                    $price    = $amount;
                    $quantity = 1;
                }

                $itemDetails[] = [
                    'id'       => (string) ($it['code'] ?? ($invoice->id . '-' . ($idx + 1))),
                    'price'    => (int) $price,
                    'quantity' => (int) $quantity,
                    'name'     => $label,
                ];
            }
        }
        if (empty($itemDetails)) {
            $itemDetails[] = [
                'id'       => (string) $invoice->id,
                'price'    => (int) $gross,
                'quantity' => 1,
                'name'     => 'Invoice ' . ($invoice->number ?? $invoice->id),
            ];
        }

        $params = [
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
            // Allow bank transfer / VA, ewallet, QRIS, etc. Snap UI governs methods
            'enabled_payments' => null,
            // Custom field for quick context in order details (displayed in dashboard and some payment pages)
            ...($roomNo ? ['custom_field1' => 'Kamar ' . $roomNo] : []),
            // Optional callbacks (primarily for redirect mode)
            'callbacks' => [
                'finish' => route('payments.midtrans.finish'),
            ],
        ];

        $snapResp = \Midtrans\Snap::createTransaction($params);
        $token    = (string) ($snapResp->token ?? $snapResp['token'] ?? '');
        $redir    = (string) ($snapResp->redirect_url ?? $snapResp['redirect_url'] ?? '');

        return [
            'order_id'     => $orderId,
            'token'        => $token,
            'redirect_url' => $redir,
            'additional'   => [
                'params' => $params,
                'raw'    => $snapResp,
            ],
        ];
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
        $status = 'Pending';
        $paidAt = null;

        if (in_array($trx, ['settlement', 'capture'], true) && $fraud !== 'challenge') {
            $status = 'Completed';
            $paidAt = (string) ($notif['settlement_time'] ?? ($notif['transaction_time'] ?? null));
        } elseif ($trx === 'pending') {
            $status = 'Pending';
        } elseif (in_array($trx, ['deny', 'cancel', 'expire', 'failure'], true)) {
            $status = $trx === 'cancel' ? 'Cancelled' : 'Failed';
        }

        return ['status' => $status, 'paid_at' => $paidAt];
    }
}
