<?php

namespace App\Events;

use App\Models\Invoice;
use Illuminate\Queue\SerializesModels;

class InvoiceReopened
{
    use SerializesModels;

    public function __construct(public Invoice $invoice)
    {
    }
}
