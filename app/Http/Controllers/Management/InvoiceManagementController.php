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

        // If this invoice is now marked Paid and it covers the full term,
        // mark the related contract as fully paid.
        try {
            $invoice->refresh();
            if ($invoice->status === \App\Enum\InvoiceStatus::PAID) {
                /** @var \App\Models\Contract|null $contract */
                $contract = $invoice->contract;
                if ($contract && !$contract->paid_in_full_at) {
                    if ($this->invoiceCoversFullTerm($invoice)) {
                        $contract->forceFill(['paid_in_full_at' => now()])->save();
                    }
                }
            }
        } catch (\Throwable $e) {
            // no-op: we don't want to block API on this flag update
        }

        return response()->json(['success' => true]);
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Determine if an invoice covers the full contract term.
     * Rules:
     * - For non-monthly contracts (daily/weekly), the single invoice always covers the term.
     * - For monthly contracts, when the RENT item has qty > 1 (pay-in-full upfront), it covers the term.
     */
    protected function invoiceCoversFullTerm(Invoice $invoice): bool
    {
        $contract = $invoice->contract;
        if (!$contract) {
            return false;
        }
        /** @var \App\Models\Contract $contract */

        $period = strtolower((string) $contract->billing_period->value);
        if ($period !== strtolower('Monthly')) { // daily/weekly: always full-term in this system
            return true;
        }

        $items = (array) ($invoice->items ?? []);
        foreach ($items as $it) {
            if ((string) ($it['code'] ?? '') !== 'RENT') {
                continue;
            }
            $qty = (int) (($it['meta']['qty'] ?? 1));
            if ($qty > 1) {
                return true;
            }
        }

        return false;
    }
}
