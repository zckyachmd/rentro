<?php

namespace App\Http\Controllers\Tenant;

use App\Enum\InvoiceStatus;
use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\Gateway\Contracts\MidtransGatewayInterface;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class MidtransController extends Controller
{
    public function __construct(
        private readonly MidtransGatewayInterface $midtrans,
        private readonly PaymentService $payments,
    ) {
    }

    /**
     * Payment page for a specific invoice (tenant POV).
     * Shows summary and prepares Snap client key.
     */
    public function page(Request $request, \App\Models\Invoice $invoice)
    {
        $invoice->load(['contract:id,user_id,room_id', 'contract.room:id,number,name']);
        /** @var \App\Models\Contract|null $ownContract */
        $ownContract = $invoice->contract;
        if (!$ownContract || (string) $ownContract->user_id !== (string) $request->user()->id) {
            abort(404);
        }

        // Compute outstanding
        $totalPaid   = (int) $invoice->payments()->where('status', \App\Enum\PaymentStatus::COMPLETED->value)->sum('amount_cents');
        $outstanding = max(0, (int) $invoice->amount_cents - $totalPaid);

        // Load latest Midtrans pending payment (if any) to restore instructions
        /** @var \App\Models\Payment|null $pendingPayment */
        $pendingPayment = $invoice->payments()
            ->where('provider', 'Midtrans')
            ->where('status', \App\Enum\PaymentStatus::PENDING->value)
            ->latest('id')
            ->first(['id', 'meta', 'provider', 'status', 'va_number', 'va_expired_at']);

        $pending = null;
        if ($pendingPayment) {
            $mid       = (array) ($pendingPayment->meta['midtrans'] ?? []);
            $notif     = (array) ($mid['last_notification'] ?? []);
            $instr     = (array) ($mid['instructions'] ?? []);
            $vaNumbers = $notif['va_numbers'] ?? [];
            $bank      = null;
            $va        = null;
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
            $pending = [
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

        /** @var \App\Models\Room|null $ownRoom */
        $ownRoom = $ownContract->room;

        return \Inertia\Inertia::render('tenant/invoice/pay', [
            'invoice' => [
                'id'                => (string) $invoice->id,
                'number'            => (string) $invoice->number,
                'due_date'          => $invoice->due_date ? $invoice->due_date->toDateString() : null,
                'amount_cents'      => (int) $invoice->amount_cents,
                'outstanding_cents' => (int) $outstanding,
                'status'            => (string) $invoice->status->value,
                'room_number'       => $ownRoom ? $ownRoom->number : null,
                'items'             => (array) ($invoice->items ?? []),
            ],
            'midtrans' => [
                'client_key'    => (string) config('midtrans.client_key'),
                'is_production' => (bool) config('midtrans.is_production', false),
            ],
            'pending' => $pending,
        ]);
    }

    /**
     * Initialize a Midtrans Snap transaction for a tenant invoice.
     * Returns JSON with token + redirect_url.
     */
    public function pay(Request $request, Invoice $invoice)
    {
        $user = $request->user();

        // Basic access control: ensure invoice belongs to the tenant user
        $invoice->load(['contract:id,user_id']);
        /** @var \App\Models\Contract|null $own */
        $own = $invoice->contract;
        if (!$own || (string) $own->user_id !== (string) $user->id) {
            abort(403);
        }

        if (!in_array($invoice->status->value, [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value], true)) {
            return response()->json(['message' => 'Invoice tidak dapat dibayar pada status ini.'], 422);
        }

        // Outstanding validation
        $totalPaid   = (int) $invoice->payments()->where('status', PaymentStatus::COMPLETED->value)->sum('amount_cents');
        $outstanding = max(0, (int) $invoice->amount_cents - $totalPaid);
        if ($outstanding <= 0) {
            return response()->json(['message' => 'Invoice sudah lunas.'], 422);
        }

        // Tenant amount is always computed server-side: charge full outstanding
        $amount = $outstanding;

        // Create a pending payment row (method: VirtualAccount as generic for gateway-initiated payments)
        $payment = $this->payments->createPayment($invoice, [
            'method'       => PaymentMethod::VIRTUAL_ACCOUNT->value,
            'status'       => PaymentStatus::PENDING->value,
            'amount_cents' => $amount,
            'meta'         => [
                'gateway' => 'midtrans',
                'channel' => 'snap',
            ],
            'note' => 'Pembayaran via Midtrans Snap',
        ], $user);

        // Create Snap transaction
        $cust = [
            'name'  => (string) $user->name,
            'email' => (string) $user->email,
            'phone' => (string) $user->phone,
        ];
        $snap = $this->midtrans->createSnap($invoice, $payment, $amount, $cust);

        // Update payment with reference (order_id) and attach raw request for troubleshooting
        $meta = array_merge($payment->meta ?? [], [
            'midtrans' => [
                'order_id' => $snap['order_id'],
                'snap'     => [
                    'token'        => $snap['token'],
                    'redirect_url' => $snap['redirect_url'],
                ],
            ],
        ]);
        $payment->update([
            'reference' => $snap['order_id'],
            'provider'  => 'Midtrans',
            'meta'      => $meta,
        ]);

        return response()->json([
            'order_id'     => $snap['order_id'],
            'token'        => $snap['token'],
            'redirect_url' => $snap['redirect_url'],
            'payment_id'   => (string) $payment->id,
        ]);
    }
}
