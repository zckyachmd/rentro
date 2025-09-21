<?php

namespace App\Console\Commands;

use App\Enum\PaymentStatus;
use App\Jobs\SyncMidtransPayment;
use App\Models\Payment;
use Illuminate\Console\Command;

class MidtransSyncPayments extends Command
{
    protected $signature   = 'payments:midtrans-sync {--limit=200 : Max records to dispatch per run}';
    protected $description = 'Queue sync jobs for pending Midtrans payments (fallback to webhooks).';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $limit = max(1, $limit);
        $ids   = Payment::query()
            ->where('provider', 'Midtrans')
            ->where('status', PaymentStatus::PENDING->value)
            ->orderBy('id')
            ->limit($limit)
            ->pluck('id');

        $count = 0;
        foreach ($ids as $id) {
            SyncMidtransPayment::dispatch((int) $id);
            $count++;
        }

        $this->info("Queued {$count} Midtrans payment(s) for sync.");

        return self::SUCCESS;
    }
}
