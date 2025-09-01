<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Invoice\StoreInvoiceRequest;
use App\Http\Requests\Management\Invoice\UpdateInvoiceRequest;
use App\Models\Contract;
use App\Models\Invoice;
use App\Traits\LogActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoiceManagementController extends Controller
{
    use LogActivity;

    public function index(Request $request)
    {
        $q = Invoice::query()->with(['contract:id,user_id,room_id', 'contract.tenant:id,name', 'contract.room:id,number']);

        if ($request->filled('status')) {
            $q->where('status', $request->string('status'));
        }

        $invoices = $q->orderByDesc('due_date')->paginate(15);
        $mapped   = $invoices->getCollection()->map(function ($inv) {
            /** @var \App\Models\Invoice $inv */
            /** @var \App\Models\Contract|null $contract */
            $contract = $inv->contract;
            /** @var \App\Models\User|null $tenant */
            $tenant = $contract?->tenant;
            /** @var \App\Models\Room|null $room */
            $room = $contract?->room;

            return [
                'id'           => (string) $inv->id,
                'number'       => $inv->number,
                'due_date'     => $inv->due_date->format('Y-m-d'),
                'amount_cents' => $inv->amount_cents,
                'status'       => $inv->status->value,
                'tenant'       => $tenant?->name,
                'room_number'  => $room?->number,
            ];
        });
        $invoicesDTO = $mapped->all();

        return Inertia::render('management/invoice/index', [
            'invoices' => [
                'data'         => $invoicesDTO,
                'current_page' => $invoices->currentPage(),
                'per_page'     => $invoices->perPage(),
                'total'        => $invoices->total(),
            ],
            'filters' => [
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function store(StoreInvoiceRequest $request)
    {
        $data     = $request->validated();
        $contract = Contract::findOrFail($data['contract_id']);

        $invoice = DB::transaction(function () use ($data, $contract) {
            return Invoice::create([
                'contract_id'  => $contract->id,
                'number'       => $data['number'],
                'period_start' => $data['period_start'] ?? null,
                'period_end'   => $data['period_end'] ?? null,
                'due_date'     => $data['due_date'],
                'amount_cents' => $data['amount_cents'],
                'status'       => $data['status'] ?? \App\Enum\InvoiceStatus::PENDING,
                'notes'        => $data['notes'] ?? null,
            ]);
        });

        return response()->json(['id' => (string) $invoice->id], 201);
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice)
    {
        $invoice->update($request->validated());

        return response()->json(['success' => true]);
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();

        return response()->json(['success' => true]);
    }
}
