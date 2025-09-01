<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Payment\StorePaymentRequest;
use App\Http\Requests\Management\Payment\UpdatePaymentRequest;
use App\Models\Invoice;
use App\Models\Payment;
use App\Traits\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentManagementController extends Controller
{
    use LogActivity;

    public function index(Request $request)
    {
        $q = Payment::query()->with(['invoice:id,number,contract_id', 'invoice.contract:id,user_id,room_id', 'invoice.contract.tenant:id,name']);

        if ($request->filled('status')) {
            $q->where('status', $request->string('status'));
        }

        $payments = $q->orderByDesc('created_at')->paginate(15);
        $mapped   = $payments->getCollection()->map(function ($p) {
            /** @var Payment $p */
            /** @var \App\Models\Invoice|null $invoice */
            $invoice = $p->invoice;
            /** @var \App\Models\Contract|null $contract */
            $contract = $invoice?->contract;
            /** @var \App\Models\User|null $tenant */
            $tenant = $contract?->tenant;

            return [
                'id'           => (string) $p->id,
                'method'       => $p->method->value,
                'status'       => $p->status->value,
                'amount_cents' => $p->amount_cents,
                'paid_at'      => $p->paid_at?->toDateTimeString(),
                'invoice'      => $invoice?->number,
                'tenant'       => $tenant?->name,
            ];
        });
        $paymentsDTO = $mapped->all();

        return Inertia::render('management/payment/index', [
            'payments' => [
                'data'         => $paymentsDTO,
                'current_page' => $payments->currentPage(),
                'per_page'     => $payments->perPage(),
                'total'        => $payments->total(),
            ],
            'filters' => [
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function store(StorePaymentRequest $request)
    {
        $data    = $request->validated();
        $invoice = Invoice::findOrFail($data['invoice_id']);

        $payment = DB::transaction(function () use ($invoice, $data) {
            return Payment::create([
                'invoice_id'    => $invoice->id,
                'method'        => $data['method'],
                'status'        => $data['status'],
                'amount_cents'  => $data['amount_cents'],
                'paid_at'       => $data['paid_at'] ?? null,
                'reference'     => $data['reference'] ?? null,
                'provider'      => $data['provider'] ?? null,
                'va_number'     => $data['va_number'] ?? null,
                'va_expired_at' => $data['va_expired_at'] ?? null,
                'meta'          => $data['meta'] ?? null,
            ]);
        });

        return response()->json(['id' => (string) $payment->id], 201);
    }

    public function update(UpdatePaymentRequest $request, Payment $payment)
    {
        $payment->update($request->validated());

        return response()->json(['success' => true]);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();

        return response()->json(['success' => true]);
    }
}
