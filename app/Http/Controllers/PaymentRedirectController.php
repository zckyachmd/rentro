<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentRedirectController extends Controller
{
    /**
     * Render a generic payment redirect result page.
     * Variant: finish|unfinish|error. Provider is optional (e.g., midtrans, xendit).
     */
    private function renderResult(Request $request, string $variant, ?string $provider = null)
    {
        $allowed = ['finish', 'unfinish', 'error'];
        if (!in_array($variant, $allowed, true)) {
            $variant = 'error';
        }

        $returnTo = (string) $request->query('return_to', route('tenant.invoices.index'));

        $payload = [
            'variant'            => $variant,
            'provider'           => $provider,
            'order_id'           => (string) $request->query('order_id', ''),
            'status_code'        => (string) $request->query('status_code', ''),
            'transaction_status' => (string) $request->query('transaction_status', ''),
            'fraud_status'       => (string) $request->query('fraud_status', ''),
            'gross_amount'       => (string) $request->query('gross_amount', ''),
            'return_to'          => $returnTo,
        ];

        return Inertia::render('payment/result', $payload);
    }

    // Generic endpoints for any provider
    public function status(Request $request, string $status)
    {
        return $this->renderResult($request, $status, null);
    }

    public function providerStatus(Request $request, string $provider, string $status)
    {
        return $this->renderResult($request, $status, $provider);
    }
}
