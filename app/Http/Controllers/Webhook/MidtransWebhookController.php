<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Midtrans\Contracts\MidtransGatewayInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function __construct(
        private readonly MidtransGatewayInterface $midtrans,
        private readonly PaymentServiceInterface $payments,
    ) {
    }

    public function handleRecurring(Request $request)
    {
        return $this->handle($request);
    }

    /**
     * Handle Midtrans notifications (callbacks/webhooks).
     * Public endpoint; validate signature.
     */
    public function handle(Request $request)
    {
        $payload = $request->all();

        $orderId      = (string) ($payload['order_id'] ?? '');
        $statusCode   = (string) ($payload['status_code'] ?? '');
        $grossAmount  = (string) ($payload['gross_amount'] ?? '');
        $signatureKey = (string) ($payload['signature_key'] ?? '');

        if (!$orderId || !$statusCode || !$grossAmount || !$signatureKey) {
            return response()->json(['message' => 'Bad request'], 400);
        }

        if (!$this->midtrans->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
            Log::warning('Midtrans signature verification failed', ['order_id' => $orderId]);

            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $payment = Payment::query()->where('reference', $orderId)->first();
        if (!$payment) {
            Log::warning('Midtrans: payment not found by order_id', ['order_id' => $orderId]);

            return response()->json(['message' => 'Not found'], 404);
        }

        // Update payment based on status mapping
        $mapped  = $this->midtrans->mapStatus($payload);
        $updates = [
            'status' => $mapped['status'],
        ];
        if ($mapped['paid_at']) {
            $updates['paid_at'] = $mapped['paid_at'];
        }

        // Capture VA details (va_number, expiry_time)
        $va = $this->midtrans->extractVaFieldsFromPayload($payload);
        if (!empty($va['va_number'])) {
            $updates['va_number'] = $va['va_number'];
        }
        if (!empty($va['expiry_time'])) {
            $updates['va_expired_at'] = $va['expiry_time'];
        }

        // Merge meta for audit
        $md = (array) (($payment->meta['midtrans'] ?? []));
        // Extract instruction fields for better UX on frontend
        $md['instructions']      = $this->midtrans->extractInstructionMetaFromPayload($payload);
        $md['last_notification'] = $payload;

        $meta = array_merge($payment->meta ?? [], [
            'midtrans' => $md,
        ]);

        $payment->update(array_merge($updates, ['meta' => $meta]));

        // Recalculate invoice on terminal states and pending as well (keeps outstanding in sync)
        $invOwn = $payment->invoice;
        if ($invOwn) {
            $this->payments->recalculateInvoice($invOwn);
        }

        // Return acknowledgment per Midtrans expectation
        return response()->json(['message' => 'OK']);
    }
}
