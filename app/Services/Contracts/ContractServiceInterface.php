<?php

namespace App\Services\Contracts;

use App\Models\Contract;

interface ContractServiceInterface
{
    /**
     * Create a contract, generate initial invoice(s), and optionally mark as paid
     * depending on input flags. Implementations must:
     * - validate duration & allowed terms against settings,
     * - compute end date & billing day (respecting prorata settings),
     * - create the first invoice(s) following the chosen payment plan.
     *
     * @param array<string,mixed> $data Validated payload from controller/form
     * @return Contract
     */
    public function create(array $data): Contract;

    /**
     * Cancel a contract: set status to Cancelled, stop auto-renew,
     * cancel pending invoices/payments, and free the room.
     */
    public function cancel(\App\Models\Contract $contract): void;
}
