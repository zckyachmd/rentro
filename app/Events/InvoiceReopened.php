<?php

namespace App\Events;

use App\Models\Invoice;

class InvoiceReopened
{
    public function __construct(public Invoice $invoice)
    {
    }
}
