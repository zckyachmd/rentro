<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enum\InvoiceStatus;
use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\PayVaRequest;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Contracts\InvoiceServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Midtrans\Contracts\MidtransGatewayInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MidtransController extends Controller
{
    public function __construct(
        private readonly MidtransGatewayInterface $midtrans,
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

    // computeOutstanding removed; inline in payVa for simplicity

    public function payVa(PayVaRequest $request, Invoice $invoice): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $bank = (string) $data['bank'];

        $this->assertOwnership($invoice, $request);

        if (!in_array($invoice->status->value, [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value], true)) {
            return response()->json(['message' => 'Invoice tidak dapat dibayar pada status ini.'], 422);
        }

        $totals      = $this->invoices->totals($invoice);
        $outstanding = (int) $totals['outstanding'];
        if ($outstanding <= 0) {
            return response()->json(['message' => 'Invoice sudah lunas.'], 422);
        }

        $amount = $outstanding;

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Payment> $toExpire */
        $toExpire = $invoice->payments()
            ->where('provider', 'Midtrans')
            ->where('status', PaymentStatus::PENDING->value)
            ->get(['id', 'reference', 'meta']);
        foreach ($toExpire as $pp) {
            /** @var Payment $pp */
            $md      = (array) (($pp->meta['midtrans'] ?? []));
            $orderId = (string) ($pp->reference ?: ($md['order_id'] ?? ''));
            if ($orderId !== '') {
                $this->midtrans->expireTransaction($orderId);
            }
        }

        // Always void locally regardless of expire outcome
        $this->payments->voidPendingPaymentsForInvoice($invoice, 'Midtrans', 'Switch to VA ' . strtoupper($bank), $user);

        $payment = $this->payments->createPayment($invoice, [
            'method'       => PaymentMethod::VIRTUAL_ACCOUNT->value,
            'status'       => PaymentStatus::PENDING->value,
            'amount_cents' => $amount,
            'meta'         => [
                'gateway'      => 'midtrans',
                'channel'      => 'core_api',
                'payment_type' => 'bank_transfer',
                'bank'         => $bank,
            ],
            'note' => 'Pembayaran VA via Midtrans Core API',
        ], $user);

        $cust = [
            'name'  => (string) $user->name,
            'email' => (string) $user->email,
            'phone' => (string) $user->phone,
        ];
        $res = $this->midtrans->createVa($invoice, $payment, $amount, $bank, $cust);

        $md = [
            'order_id'     => $res['order_id'],
            'instructions' => array_filter([
                'payment_type' => $res['payment_type'] ?? 'bank_transfer',
                'bank'         => $res['bank'] ?? null,
                'va_number'    => $res['va_number'] ?? null,
                'expiry_time'  => $res['expiry_time'] ?? null,
            ]),
            'last_charge' => $res['additional']['raw'] ?? null,
        ];
        $meta = array_merge($payment->meta ?? [], [
            'midtrans' => $md,
        ]);

        $update = [
            'reference' => $res['order_id'],
            'provider'  => 'Midtrans',
            'meta'      => $meta,
        ];
        if (!empty($res['va_number'])) {
            $update['va_number'] = (string) $res['va_number'];
        }
        if (!empty($res['expiry_time'])) {
            $update['va_expired_at'] = (string) $res['expiry_time'];
        }
        $payment->update($update);

        // Flash success for frontend flash-toaster (will show on next Inertia reload)
        session()->flash('success', 'VA berhasil dibuat.');

        return response()->json([
            'payment_id'  => (string) $payment->id,
            'order_id'    => $res['order_id'],
            'bank'        => $bank,
            'va_number'   => $res['va_number'] ?? null,
            'expiry_time' => $res['expiry_time'] ?? null,
        ]);
    }

    public function status(Request $request, Invoice $invoice): JsonResponse
    {
        $this->assertOwnership($invoice, $request);

        /** @var Payment|null $pendingManual */
        $pendingManual = $invoice->payments()
            ->where('provider', 'Manual')
            ->where('status', PaymentStatus::REVIEW->value)
            ->latest('id')
            ->first(['id', 'meta', 'provider', 'status']);

        if ($pendingManual) {
            $m       = (array) ($pendingManual->meta ?? []);
            $manual  = (array) ($m['manual'] ?? []);
            $pending = [
                'payment_type' => 'manual',
                'bank'         => $manual['bank'] ?? ($m['bank'] ?? null),
                'va_number'    => null,
                'expiry_time'  => null,
            ];

            return response()->json(['pending' => $pending]);
        }

        /** @var Payment|null $pendingPayment */
        $pendingPayment = $invoice->payments()
            ->where('provider', 'Midtrans')
            ->where('status', PaymentStatus::PENDING->value)
            ->latest('id')
            ->first(['id', 'meta', 'provider', 'status', 'va_number', 'va_expired_at']);

        $pending = $this->midtrans->extractPendingInfoFromPayment($pendingPayment);

        return response()->json(['pending' => $pending]);
    }

    public function cancelPending(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->assertOwnership($invoice, $request);

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Payment> $toExpire */
        $toExpire = $invoice->payments()
            ->where('provider', 'Midtrans')
            ->where('status', PaymentStatus::PENDING->value)
            ->get(['id', 'reference', 'meta']);
        foreach ($toExpire as $pp) {
            /** @var Payment $pp */
            $md      = (array) (($pp->meta['midtrans'] ?? []));
            $orderId = (string) ($pp->reference ?: ($md['order_id'] ?? ''));
            if ($orderId !== '') {
                $this->midtrans->expireTransaction($orderId);
            }
        }

        $this->payments->voidPendingPaymentsForInvoice($invoice, 'Midtrans', 'User switched bank from pay-dialog', $request->user());

        return back()->with('success', 'VA sebelumnya dibatalkan.');
    }
}
