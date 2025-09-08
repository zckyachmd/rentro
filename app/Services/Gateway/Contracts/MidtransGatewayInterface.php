<?php

namespace App\Services\Gateway\Contracts;

use App\Models\Invoice;
use App\Models\Payment;

interface MidtransGatewayInterface
{
    /** Initialize SDK configuration */
    public function boot(): void;

    /**
     * Create a Snap transaction for a specific invoice payment attempt.
     *
     * @param Invoice $invoice
     * @param Payment $payment
     * @param int $amountCents
     * @param array $customer ['name' => string, 'email' => string, 'phone' => string]
     * @return array{order_id:string,token:string,redirect_url:string,additional:array}
     */
    public function createSnap(Invoice $invoice, Payment $payment, int $amountCents, array $customer = []): array;

    /** Verify Midtrans notification signature */
    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool;

    /** Map Midtrans status into internal payment status */
    public function mapStatus(array $notif): array;
}
