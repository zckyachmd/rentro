<?php

namespace App\Services\Contracts;

use App\Models\Contract;
use Illuminate\Support\Collection;

interface InvoiceServiceInterface
{
    /**
     * Create initial invoices for a freshly created contract.
     * Returns a collection of Invoice models (persisted).
     *
     * @param Contract $contract
     * @param array $data Validated request data (rent_cents, deposit_cents, billing_period, duration_count, monthly_payment_mode)
     * @return Collection<int, \App\Models\Invoice>
     */
    public function createInitialInvoices(Contract $contract, array $data): Collection;
}
