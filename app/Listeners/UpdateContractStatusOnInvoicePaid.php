<?php

namespace App\Listeners;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Enum\RoomStatus;
use App\Events\InvoicePaid;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Invoice;
use App\Traits\LogActivity;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Middleware\RateLimited;
use Illuminate\Support\Facades\DB;

class UpdateContractStatusOnInvoicePaid implements ShouldQueue
{
    use LogActivity;
    use Queueable;

    public function __construct()
    {
        $this->onQueue('contracts');
    }

    public function handle(InvoicePaid $event): void
    {
        /** @var Invoice $invoice */
        $invoice = $event->invoice;
        if (!$invoice) {
            return;
        }

        $invoiceStatus = $invoice->status instanceof \BackedEnum
            ? $invoice->status->value
            : (string) $invoice->getAttribute('status');
        if ($invoiceStatus !== InvoiceStatus::PAID->value) {
            return;
        }

        /** @var int|string|null $contractId */
        $contractId = $invoice->getAttribute('contract_id');
        if (!$contractId) {
            return;
        }

        $raw = DB::table('contracts')->where('id', $contractId)
            ->first(['id', 'status', 'start_date', 'end_date', 'room_id', 'paid_in_full_at']);
        if (!$raw) {
            return;
        }

        $current               = (string) ($raw->status ?? '');
        $eligibleForTransition = in_array($current, [
            ContractStatus::PENDING_PAYMENT->value,
            ContractStatus::BOOKED->value,
            ContractStatus::OVERDUE->value,
        ], true);

        if ($eligibleForTransition) {
            $today          = now()->startOfDay();
            $startDate      = $raw->start_date ? Carbon::parse((string) $raw->start_date)->startOfDay() : null;
            $requireCheckin = (bool) AppSetting::config('handover.require_checkin_for_activate', true);

            $next = ContractStatus::BOOKED->value;
            if (!$requireCheckin && $startDate && $startDate->lessThanOrEqualTo($today)) {
                $next = ContractStatus::ACTIVE->value;
            }

            // Update contract status without hydrating the model (avoid enum cast issues)
            DB::table('contracts')->where('id', $contractId)->update(['status' => $next]);

            // Update room status accordingly (raw to avoid casts); keep existing occupancy if already occupied
            if (!empty($raw->room_id)) {
                $roomStatus = (string) DB::table('rooms')->where('id', $raw->room_id)->value('status');
                if ($next === ContractStatus::ACTIVE->value) {
                    if ($roomStatus !== RoomStatus::OCCUPIED->value) {
                        DB::table('rooms')->where('id', $raw->room_id)->update(['status' => RoomStatus::OCCUPIED->value]);
                    }
                } elseif ($next === ContractStatus::BOOKED->value) {
                    if ($roomStatus !== RoomStatus::OCCUPIED->value && $roomStatus !== RoomStatus::RESERVED->value) {
                        DB::table('rooms')->where('id', $raw->room_id)->update(['status' => RoomStatus::RESERVED->value]);
                    }
                }
            }

            try {
                $contractModel = Contract::query()->find($contractId);
                if ($contractModel) {
                    $this->logEvent(
                        event: 'contract_status_changed',
                        subject: $contractModel,
                        properties: [
                            'contract_id' => (string) $contractId,
                            'invoice_id'  => (string) $invoice->getAttribute('id'),
                            'from'        => $current,
                            'to'          => $next,
                            'cause'       => 'invoice_paid',
                        ],
                        logName: 'billing',
                    );
                }
            } catch (\Throwable $e) {
                // swallow logging errors
            }
        }

        $hasUnpaid = DB::table('invoices')
            ->where('contract_id', $contractId)
            ->whereNot('status', InvoiceStatus::CANCELLED->value)
            ->whereNot('status', InvoiceStatus::PAID->value)
            ->exists();

        if (!$hasUnpaid) {
            $maxPeriodEnd = DB::table('invoices')
                ->where('contract_id', $contractId)
                ->whereNot('status', InvoiceStatus::CANCELLED->value)
                ->max('period_end');

            $contractEnd = $raw->end_date ? Carbon::parse((string) $raw->end_date)->startOfDay() : null;
            $coverageOk  = $contractEnd === null;
            if ($contractEnd && $maxPeriodEnd) {
                try {
                    $maxEnd     = Carbon::parse((string) $maxPeriodEnd)->startOfDay();
                    $coverageOk = $maxEnd->greaterThanOrEqualTo($contractEnd);
                } catch (\Throwable) {
                    $coverageOk = false;
                }
            }

            if ($coverageOk && empty($raw->paid_in_full_at)) {
                $latestPaidAt = DB::table('payments')
                    ->join('invoices', 'payments.invoice_id', '=', 'invoices.id')
                    ->where('invoices.contract_id', $contractId)
                    ->where('payments.status', PaymentStatus::COMPLETED->value)
                    ->max('payments.paid_at');

                DB::table('contracts')->where('id', $contractId)->update([
                    'paid_in_full_at' => $latestPaidAt ?: now(),
                ]);
            }
        }
    }

    /**
     * Provide Horizon tags for this queued listener.
     *
     * @return array<int, string>
     */
    public function tags(InvoicePaid $event): array
    {
        $invoiceId  = (string) ($event->invoice->getAttribute('id') ?? '');
        $contractId = (string) ($event->invoice->getAttribute('contract_id') ?? '');

        return ['contracts', 'listener:invoice_paid', 'invoice:' . $invoiceId, 'contract:' . $contractId];
    }

    /**
     * Queue middleware for rate limiting.
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [
            new RateLimited('listener:invoice-paid'),
            new RateLimited('listener:invoice-contract'),
        ];
    }
}
