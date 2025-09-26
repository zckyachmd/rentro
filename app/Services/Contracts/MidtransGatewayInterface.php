<?php

namespace App\Services\Contracts;

use App\Models\Invoice;
use App\Models\Payment;

interface MidtransGatewayInterface
{
    /**
     * Initialize Midtrans SDK configuration for the current request.
     * Sets server key, environment, and HTTP client options (timeouts, headers).
     * Safe to call multiple times.
     */
    public function boot(): void;

    /**
     * Create a Core API Bank Transfer VA charge.
     *
     * Responsibilities:
     * - Compose deterministic order_id based on Payment id (and room hint when available)
     * - Build Midtrans-compliant item_details from invoice items
     * - Call Midtrans Core API `charge` with `payment_type=bank_transfer`
     * - Normalize response to array and return essential details
     *
     * @param Invoice $invoice The invoice being paid
     * @param Payment $payment Pending payment row created for this charge
     * @param int $amountCents Total amount in smallest unit (IDR without decimals)
     * @param string $bank Payment bank code: one of bca|bni|bri|permata|cimb
     * @param array $customer Optional customer info: ['name' => string, 'email' => string, 'phone' => string]
     * @return array{
     *   order_id:string,
     *   payment_type:string,
     *   bank:string,
     *   va_number:string|null,
     *   expiry_time:string|null,
     *   additional:array{params:array,raw:array}
     * }
     */
    public function createVa(Invoice $invoice, Payment $payment, int $amountCents, string $bank, array $customer = []): array;

    /**
     * Verify Midtrans notification signature using SHA512 of
     * order_id + status_code + gross_amount + server_key.
     */
    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool;

    /**
     * Map Midtrans transaction status to internal Payment status + paid_at.
     * @param array $notif Normalized Midtrans notification payload
     * @return array{status:string, paid_at:string|null}
     */
    public function mapStatus(array $notif): array;

    /**
     * Fetch transaction status from Midtrans by order_id.
     * Returns normalized Midtrans payload as array.
     *
     * @return array
     */
    public function fetchTransactionStatus(string $orderId): array;

    /**
     * Extract lightweight pending info used by frontend from a Payment's meta.
     * Returns null when payment is null.
     *
     * @return array<string, mixed>|null
     */
    public function extractPendingInfoFromPayment(?Payment $pendingPayment): ?array;

    /**
     * Extract VA number and expiry_time from Midtrans payload (notif/charge response).
     *
     * @return array{va_number: string|null, expiry_time: string|null}
     */
    public function extractVaFieldsFromPayload(array $payload): array;

    /**
     * Extract instruction-related fields for storing into payment meta.
     * Returns compact array without nulls.
     *
     * @return array{payment_type?:string,pdf_url?:string,payment_code?:string,store?:string,qr_string?:string,actions?:mixed}
     */
    public function extractInstructionMetaFromPayload(array $payload): array;

    /**
     * Best-effort expire a Midtrans transaction by order_id.
     * Returns true on success, false on failure.
     */
    public function expireTransaction(string $orderId): bool;
}
