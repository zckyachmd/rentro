<?php

namespace App\Services\Contracts;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\UploadedFile;

interface PaymentServiceInterface
{
    /**
     * Create a payment for the given invoice and recalculate invoice status/outstanding.
     * Handles optional evidence upload.
     *
     * @param array $data Validated payload
     */
    public function createPayment(Invoice $invoice, array $data, ?User $user = null, ?UploadedFile $attachment = null): Payment;

    /**
     * Void a single payment and recalculate its invoice.
     */
    public function voidPayment(Payment $payment, ?string $reason, ?User $user = null): void;

    /**
     * Recalculate invoice outstanding and status based on completed payments.
     */
    public function recalculateInvoice(Invoice $invoice): void;

    /**
     * Void all pending payments for an invoice (optionally filtered by provider) and recalc once.
     * Returns number of payments voided.
     */
    public function voidPendingPaymentsForInvoice(Invoice $invoice, ?string $provider = null, ?string $reason = null, ?User $user = null): int;
}
