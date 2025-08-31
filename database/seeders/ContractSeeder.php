<?php

namespace Database\Seeders;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Enum\RoleName;
use App\Enum\RoomStatus;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class ContractSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil 5 tenant dan 5 kamar kosong
        $tenants = User::role(RoleName::TENANT->value)->take(5)->get();
        $rooms   = Room::where('status', RoomStatus::VACANT->value)->take($tenants->count())->get();

        if ($tenants->isEmpty() || $rooms->isEmpty()) {
            return; // nothing to seed
        }

        foreach ($tenants as $i => $tenant) {
            $room = $rooms[$i] ?? null;
            if (!$room) { break; }

            $start = now()->startOfDay();
            $rent  = $room->price_cents ?? (Arr::random([900_000, 1_200_000, 1_500_000, 2_000_000]) * 100);

            $contract = Contract::create([
                'user_id'        => $tenant->id,
                'room_id'        => $room->id,
                'start_date'     => $start->toDateString(),
                'end_date'       => (clone $start)->addMonth()->toDateString(),
                'rent_cents'     => $rent,
                'deposit_cents'  => (int) round($rent * 0.5),
                'billing_period' => BillingPeriod::MONTHLY,
                'billing_day'    => (int) now()->day,
                'auto_renew'     => true,
                'renewal_cancelled_at' => null,
                'deposit_refund_cents' => null,
                'deposit_refunded_at'  => null,
                'status'         => ContractStatus::ACTIVE,
                'notes'          => null,
            ]);

            // Generate invoice bulan pertama
            $periodEnd = (clone $start)->addMonth();
            $invoice = Invoice::create([
                'contract_id'  => $contract->id,
                'number'       => $this->makeInvoiceNumber(),
                'period_start' => $start->toDateString(),
                'period_end'   => $periodEnd->toDateString(),
                'due_date'     => $start->toDateString(),
                'amount_cents' => $rent,
                'status'       => InvoiceStatus::PENDING,
                'paid_at'      => null,
                'notes'        => null,
            ]);

            // Random: langsung bayar cash atau generate VA (pending)
            $payCash = (bool) random_int(0, 1);
            if ($payCash) {
                Payment::create([
                    'invoice_id'   => $invoice->id,
                    'method'       => PaymentMethod::CASH,
                    'status'       => PaymentStatus::COMPLETED,
                    'amount_cents' => $rent,
                    'paid_at'      => now(),
                    'reference'    => 'CASH-' . strtoupper(str()->random(8)),
                    'provider'     => 'CASHIER',
                    'va_number'    => null,
                    'va_expired_at'=> null,
                    'meta'         => null,
                ]);

                $invoice->update([
                    'status'  => InvoiceStatus::PAID,
                    'paid_at' => now(),
                ]);
            } else {
                Payment::create([
                    'invoice_id'   => $invoice->id,
                    'method'       => PaymentMethod::VIRTUAL_ACCOUNT,
                    'status'       => PaymentStatus::PENDING,
                    'amount_cents' => $rent,
                    'paid_at'      => null,
                    'reference'    => 'VA-' . strtoupper(str()->random(8)),
                    'provider'     => Arr::random(['BNI', 'BCA', 'BRI']),
                    'va_number'    => '8808' . fake()->numerify('##########'),
                    'va_expired_at'=> now()->addDays(3),
                    'meta'         => null,
                ]);
            }

            // Random: sebagian kecil tenant batalkan auto-renewal menjelang akhir masa kontrak (<=7 hari)
            if (random_int(1, 5) === 1) { // ~20%
                $cancelAt = (clone $periodEnd)->subDays(random_int(1, 7));
                $contract->update([
                    'renewal_cancelled_at' => $cancelAt,
                    'deposit_refund_cents' => $contract->deposit_cents,
                ]);
            }

            // Update status kamar menjadi terisi
            $room->update(['status' => RoomStatus::OCCUPIED->value]);
        }
    }

    protected function makeInvoiceNumber(): string
    {
        static $used = [];
        do {
            $candidate = 'INV-' . now()->format('Ym') . '-' . strtoupper(str()->random(6));
        } while (isset($used[$candidate]) || \App\Models\Invoice::where('number', $candidate)->exists());
        $used[$candidate] = true;
        return $candidate;
    }
}
