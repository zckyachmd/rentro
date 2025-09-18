<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enum\InvoiceStatus;
use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Invoice;
use App\Services\Contracts\InvoiceServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentServiceInterface $payments,
        private readonly InvoiceServiceInterface $invoices,
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

    public function payManual(Request $request, Invoice $invoice): JsonResponse
    {
        $this->assertOwnership($invoice, $request);

        $validated = $request->validate([
            'bank'       => 'required|string|max:30',
            'note'       => 'nullable|string|max:200',
            'paid_at'    => 'required|date',
            'attachment' => 'required|file|max:5120|mimes:jpg,jpeg,png,pdf',
        ]);

        if (!in_array($invoice->status->value, [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value], true)) {
            return response()->json(['message' => 'Invoice tidak dapat dibayar pada status ini.'], 422);
        }

        $totals      = $this->invoices->totals($invoice);
        $outstanding = (int) $totals['outstanding'];
        if ($outstanding <= 0) {
            return response()->json(['message' => 'Invoice sudah lunas.'], 422);
        }

        $this->payments->voidPendingPaymentsForInvoice($invoice, 'Manual', 'Resubmitted manual transfer', $request->user());

        $meta = [
            'payment_type' => 'manual',
            'manual'       => [
                'bank' => (string) $validated['bank'],
            ],
            'submitted_by' => (string) $request->user()->name,
        ];

        $payment = $this->payments->createPayment(
            invoice: $invoice,
            data: [
                'method'       => PaymentMethod::TRANSFER->value,
                'status'       => PaymentStatus::REVIEW->value,
                'amount_cents' => $outstanding,
                'provider'     => 'Manual',
                'meta'         => $meta,
                'note'         => (string) ($validated['note'] ?? ''),
                'paid_at'      => (string) $validated['paid_at'],
            ],
            user: $request->user(),
            attachment: null,
        );

        // Store attachment evidence using HasAttachments (private bucket)
        try {
            $file = $request->file('attachment');
            if ($file) {
                $payment->storeAttachmentFiles([$file], 'private');
            }
        } catch (\Throwable $e) {
            // ignore; admin can request re-upload
        }

        // Flash success for Inertia clients; fetch callers will still receive JSON below.
        session()->flash('success', 'Bukti transfer terkirim. Menunggu review admin.');

        return response()->json([
            'message'    => 'Bukti transfer terkirim. Menunggu review admin.',
            'payment_id' => (string) $payment->id,
            'status'     => (string) $payment->status->value,
        ]);
    }
}
