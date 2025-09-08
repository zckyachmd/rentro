<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentRedirectController extends Controller
{
    private function renderResult(Request $request, string $variant)
    {
        $payload = [
            'variant'            => $variant, // finish|unfinish|error
            'order_id'           => (string) $request->query('order_id', ''),
            'status_code'        => (string) $request->query('status_code', ''),
            'transaction_status' => (string) $request->query('transaction_status', ''),
            'fraud_status'       => (string) $request->query('fraud_status', ''),
            'gross_amount'       => (string) $request->query('gross_amount', ''),
            'return_to'          => route('tenant.invoices.index'),
        ];

        return Inertia::render('payment/midtrans/result', $payload);
    }

    public function finish(Request $request)
    {
        return $this->renderResult($request, 'finish');
    }
}
