<?php

namespace App\Events;

use App\Models\Invoice;

class InvoicePaid
{
    public function __construct(public Invoice $invoice)
    {
    }
}
