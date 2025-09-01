<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $userId   = $request->user()->id;
        $invoices = Invoice::query()
            ->whereHas('contract', fn ($q) => $q->where('user_id', $userId))
            ->with(['contract.room:id,number'])
            ->orderByDesc('due_date')
            ->get()
            ->map(function (Invoice $inv) {
                /** @var \App\Models\Contract|null $contract */
                $contract = $inv->contract;
                /** @var \App\Models\Room|null $room */
                $room = $contract?->room;

                return [
                    'id'           => (string) $inv->id,
                    'number'       => $inv->number,
                    'due_date'     => $inv->due_date->format('Y-m-d'),
                    'amount_cents' => $inv->amount_cents,
                    'status'       => $inv->status->value,
                    'room_number'  => $room?->number,
                ];
            });

        return Inertia::render('tenant/invoice/index', [
            'invoices' => [
                'data' => $invoices,
            ],
        ]);
    }
}
