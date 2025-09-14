<?php

namespace App\Listeners;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Events\InvoicePaid;
use App\Models\Contract;
use App\Models\Invoice;
use App\Traits\LogActivity;
use Carbon\Carbon;

class UpdateContractStatusOnInvoicePaid
{
    use LogActivity;

    public function handle(InvoicePaid $event): void
    {
        /** @var Invoice $invoice */
        $invoice  = $event->invoice->fresh(['contract']);
        $contract = $invoice->contract;
        /** @var Contract|null $contract */
        if (!$contract) {
            return;
        }
        /** @phpstan-assert Contract $contract */

        $current = (string) $contract->status->value;
        if (
            in_array($current, [
                ContractStatus::PENDING_PAYMENT->value,
                ContractStatus::BOOKED->value,
                ContractStatus::OVERDUE->value,
            ], true)
        ) {
            $today     = now()->startOfDay();
            $startDate = $contract->start_date->copy()->startOfDay();
            $next      = $startDate && $startDate->lessThanOrEqualTo($today)
                ? ContractStatus::ACTIVE
                : ContractStatus::BOOKED;

            $contract->forceFill(['status' => $next])->save();

            if ($next === ContractStatus::ACTIVE) {
                /** @var \App\Models\Room|null $room */
                $room = $contract->room;
                if ($room && $room->status->value !== \App\Enum\RoomStatus::OCCUPIED->value) {
                    $room->update(['status' => \App\Enum\RoomStatus::OCCUPIED->value]);
                }
            } elseif ($next === ContractStatus::BOOKED) {
                /** @var \App\Models\Room|null $room */
                $room = $contract->room;
                if ($room && $room->status->value !== \App\Enum\RoomStatus::RESERVED->value) {
                    // Pre-activation paid contract holds the room as Reserved
                    if ($room->status->value !== \App\Enum\RoomStatus::OCCUPIED->value) {
                        $room->update(['status' => \App\Enum\RoomStatus::RESERVED->value]);
                    }
                }
            }

            $this->logEvent(
                event: 'contract_status_changed',
                subject: $contract,
                properties: [
                    'contract_id' => (string) $contract->getAttribute('id'),
                    'invoice_id'  => (string) $invoice->getAttribute('id'),
                    'from'        => $current,
                    'to'          => $next->value,
                    'cause'       => 'invoice_paid',
                ],
                logName: 'billing',
            );
        }

        $hasUnpaid = $contract->invoices()
            ->whereNot('status', InvoiceStatus::CANCELLED->value)
            ->whereNot('status', InvoiceStatus::PAID->value)
            ->exists();

        if (!$hasUnpaid) {
            $maxPeriodEnd = $contract->invoices()
                ->whereNot('status', InvoiceStatus::CANCELLED->value)
                ->max('period_end');

            $contractEnd = $contract->end_date ? $contract->end_date->copy()->startOfDay() : null;
            $coverageOk  = $contractEnd === null;
            if ($contractEnd && $maxPeriodEnd) {
                try {
                    $maxEnd     = Carbon::parse((string) $maxPeriodEnd)->startOfDay();
                    $coverageOk = $maxEnd->greaterThanOrEqualTo($contractEnd);
                } catch (\Throwable) {
                    $coverageOk = false;
                }
            }

            if ($coverageOk && empty($contract->paid_in_full_at)) {
                $latestPaidAt = $contract->payments()
                    ->where('status', PaymentStatus::COMPLETED->value)
                    ->max('paid_at');

                $contract->forceFill([
                    'paid_in_full_at' => $latestPaidAt ?: now(),
                ])->save();
            }
        }
    }
}
