<?php

namespace App\Http\Controllers;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Enum\RoleName;
use App\Enum\RoomStatus;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user     = $request->user();
        $isTenant = $user?->hasRole(RoleName::TENANT->value) ?? false;

        // Date range filter (inclusive). Defaults: last 30 days.
        $start = $request->query('start');
        $end   = $request->query('end');
        try {
            $startDate = $start ? Carbon::createFromFormat('Y-m-d', (string) $start)->startOfDay() : now()->copy()->subDays(29)->startOfDay();
        } catch (\Throwable) {
            $startDate = now()->copy()->subDays(29)->startOfDay();
        }
        try {
            $endDate = $end ? Carbon::createFromFormat('Y-m-d', (string) $end)->endOfDay() : now()->copy()->endOfDay();
        } catch (\Throwable) {
            $endDate = now()->copy()->endOfDay();
        }
        if ($endDate->lessThan($startDate)) {
            [$startDate, $endDate] = [$endDate->copy()->startOfDay(), $startDate->copy()->endOfDay()];
        }

        // Rooms summary
        $roomsByStatus = Room::query()
            ->selectRaw('status, COUNT(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $roomVacant      = (int) ($roomsByStatus[RoomStatus::VACANT->value] ?? 0);
        $roomReserved    = (int) ($roomsByStatus[RoomStatus::RESERVED->value] ?? 0);
        $roomOccupied    = (int) ($roomsByStatus[RoomStatus::OCCUPIED->value] ?? 0);
        $roomMaintenance = (int) ($roomsByStatus[RoomStatus::MAINTENANCE->value] ?? 0);
        $roomInactive    = (int) ($roomsByStatus[RoomStatus::INACTIVE->value] ?? 0);

        $roomAvailable = $roomVacant + $roomReserved + $roomOccupied;
        $roomTotal     = $roomAvailable + $roomMaintenance + $roomInactive;
        $occNumerator  = $roomReserved + $roomOccupied;
        $occRate       = $roomAvailable > 0 ? round($occNumerator / $roomAvailable, 4) : 0.0;

        // Contracts summary
        $contractsByStatus = Contract::query()
            ->selectRaw('status, COUNT(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');
        $contractsActive  = (int) ($contractsByStatus['active'] ?? 0);
        $contractsBooked  = (int) ($contractsByStatus['booked'] ?? 0);
        $contractsPending = (int) ($contractsByStatus['pending_payment'] ?? 0);
        $contractsOverdue = (int) ($contractsByStatus['overdue'] ?? 0);
        $contractsTotal   = array_sum(array_map(fn ($v) => (int) $v, $contractsByStatus->all()));

        // Invoices summary
        $invoicesPending = (int) Invoice::query()->where('status', InvoiceStatus::PENDING->value)->count();
        $invoicesOverdue = (int) Invoice::query()->where('status', InvoiceStatus::OVERDUE->value)->count();
        $outstandingSum  = (int) Invoice::query()
            ->whereNotIn('status', [InvoiceStatus::PAID->value, InvoiceStatus::CANCELLED->value])
            ->sum('outstanding_idr');

        // Payments summary
        $now          = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOf7d    = $now->copy()->subDays(6)->startOfDay();
        $startOfToday = $now->copy()->startOfDay();

        $paymentsBase = Payment::query()->where('status', PaymentStatus::COMPLETED->value);

        $paymentsRange = (int) (clone $paymentsBase)
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->sum('amount_idr');
        $paymentsMtd = (int) (clone $paymentsBase)
            ->whereBetween('paid_at', [$startOfMonth, $now])
            ->sum('amount_idr');
        $payments7d = (int) (clone $paymentsBase)
            ->whereBetween('paid_at', [$startOf7d, $now])
            ->sum('amount_idr');
        $paymentsToday = (int) (clone $paymentsBase)
            ->whereBetween('paid_at', [$startOfToday, $now])
            ->sum('amount_idr');

        // Revenue timeseries per day in range
        $series = (clone $paymentsBase)
            ->selectRaw("DATE(paid_at) as d, SUM(amount_idr) as amt")
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->groupBy('d')
            ->orderBy('d')
            ->pluck('amt', 'd');
        $revSeries = [];
        $cursor    = $startDate->copy()->startOfDay();
        while ($cursor->lte($endDate)) {
            $key         = $cursor->toDateString();
            $revSeries[] = ['date' => $key, 'amount' => (int) ($series[$key] ?? 0)];
            $cursor      = $cursor->addDay();
        }

        // Invoice series per day in range (issued vs paid)
        $issuedRaw = Invoice::query()
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('d')
            ->orderBy('d')
            ->pluck('c', 'd');
        $paidRaw = Invoice::query()
            ->selectRaw('DATE(paid_at) as d, COUNT(*) as c')
            ->where('status', InvoiceStatus::PAID->value)
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->groupBy('d')
            ->orderBy('d')
            ->pluck('c', 'd');
        $invSeries = [];
        $cursor    = $startDate->copy()->startOfDay();
        while ($cursor->lte($endDate)) {
            $key         = $cursor->toDateString();
            $invSeries[] = [
                'date'   => $key,
                'issued' => (int) ($issuedRaw[$key] ?? 0),
                'paid'   => (int) ($paidRaw[$key] ?? 0),
            ];
            $cursor = $cursor->addDay();
        }

        // Recent payments list (latest 5)
        $recentPayments = Payment::query()
            ->with(['invoice.contract.tenant', 'invoice.contract.room'])
            ->where('status', PaymentStatus::COMPLETED->value)
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function (Payment $p) {
                $inv      = $p->invoice;
                $contract = $inv?->contract;
                $room     = $contract?->room;
                $tenant   = $contract?->tenant;

                return [
                    'id'         => (string) $p->id,
                    'amount'     => (int) ($p->amount_idr ?? 0),
                    'paid_at'    => optional($p->paid_at)->toDateTimeString(),
                    'invoice_no' => $inv?->number,
                    'tenant'     => $tenant?->name,
                    'room'       => optional($room)->number ?? optional($room)->name,
                ];
            });

        // Upcoming check-in (start_date) and check-out (end_date) within next 7 days
        $soonStart        = $now->copy()->startOfDay();
        $soonEnd          = $now->copy()->addDays(7)->endOfDay();
        $upcomingCheckins = Contract::query()
            ->with(['tenant', 'room'])
            ->whereBetween('start_date', [$soonStart, $soonEnd])
            ->orderBy('start_date')
            ->limit(5)
            ->get()
            ->map(function (Contract $c) {
                return [
                    'id'     => (string) $c->id,
                    'date'   => optional($c->start_date)->toDateString(),
                    'tenant' => $c->tenant?->name,
                    'room'   => optional($c->room)->number ?? optional($c->room)->name,
                    'status' => (string) $c->status->value,
                ];
            });
        $upcomingCheckouts = Contract::query()
            ->with(['tenant', 'room'])
            ->whereBetween('end_date', [$soonStart, $soonEnd])
            ->orderBy('end_date')
            ->limit(5)
            ->get()
            ->map(function (Contract $c) {
                return [
                    'id'     => (string) $c->id,
                    'date'   => optional($c->end_date)->toDateString(),
                    'tenant' => $c->tenant?->name,
                    'room'   => optional($c->room)->number ?? optional($c->room)->name,
                    'status' => (string) $c->status->value,
                ];
            });

        $payload = [
            'management' => [
                'rooms' => [
                    'total'          => $roomTotal,
                    'available'      => $roomAvailable,
                    'occupied'       => $roomOccupied,
                    'reserved'       => $roomReserved,
                    'vacant'         => $roomVacant,
                    'maintenance'    => $roomMaintenance,
                    'inactive'       => $roomInactive,
                    'occupancy_rate' => $occRate,
                ],
                'contracts' => [
                    'total'           => $contractsTotal,
                    'active'          => $contractsActive,
                    'booked'          => $contractsBooked,
                    'pending_payment' => $contractsPending,
                    'overdue'         => $contractsOverdue,
                ],
                'invoices' => [
                    'pending'           => $invoicesPending,
                    'overdue'           => $invoicesOverdue,
                    'total_outstanding' => $outstandingSum,
                    'series'            => $invSeries,
                ],
                'payments' => [
                    'range'  => $paymentsRange,
                    'mtd'    => $paymentsMtd,
                    'last7d' => $payments7d,
                    'today'  => $paymentsToday,
                    'recent' => $recentPayments,
                    'series' => $revSeries,
                ],
                'upcoming' => [
                    'checkins'  => $upcomingCheckins,
                    'checkouts' => $upcomingCheckouts,
                ],
            ],
            'filters' => [
                'start' => $startDate->toDateString(),
                'end'   => $endDate->toDateString(),
            ],
        ];

        // Tenant-specific summary (only when user has Tenant role)
        if ($isTenant && $user instanceof Authenticatable) {
            /** @var User $casted */
            $casted            = $user;
            $payload['tenant'] = $this->buildTenantSummary($casted);
        }

        return Inertia::render('dashboard/index', $payload);
    }

    /**
     * Build tenant-specific dashboard summary.
     *
     * @param User $user
     * @return array<string, mixed>
     */
    private function buildTenantSummary(User $user): array
    {
        $tenantInvoicesBase = Invoice::query()
            ->whereHas('contract', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });

        $tenantPending = (int) (clone $tenantInvoicesBase)
            ->where('status', InvoiceStatus::PENDING->value)
            ->count();
        $tenantOverdue = (int) (clone $tenantInvoicesBase)
            ->where('status', InvoiceStatus::OVERDUE->value)
            ->count();
        $tenantOutstanding = (int) (clone $tenantInvoicesBase)
            ->whereNotIn('status', [InvoiceStatus::PAID->value, InvoiceStatus::CANCELLED->value])
            ->sum('outstanding_idr');

        $tenantLatestInvoices = (clone $tenantInvoicesBase)
            ->with('contract.room')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function (Invoice $inv) {
                return [
                    'id'              => (string) $inv->id,
                    'number'          => (string) $inv->number,
                    'status'          => (string) $inv->status->value,
                    'due_date'        => optional($inv->due_date)->toDateString(),
                    'amount_idr'      => (int) ($inv->amount_idr ?? 0),
                    'outstanding_idr' => (int) ($inv->outstanding_idr ?? 0),
                    'room_number'     => optional($inv->contract?->room)->number ?? optional($inv->contract?->room)->name,
                ];
            });

        $tenantRecentPayments = Payment::query()
            ->with(['invoice'])
            ->where('status', PaymentStatus::COMPLETED->value)
            ->whereHas('invoice.contract', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function (Payment $p) {
                $inv = $p->invoice;

                return [
                    'id'         => (string) $p->id,
                    'amount'     => (int) ($p->amount_idr ?? 0),
                    'paid_at'    => optional($p->paid_at)->toDateTimeString(),
                    'invoice_no' => $inv?->number,
                ];
            });

        // Contracts (tenant-owned)
        $tenantContractsBase   = Contract::query()->where('user_id', $user->id);
        $tenantContractsTotal  = (clone $tenantContractsBase)->count();
        $tenantContractsActive = (clone $tenantContractsBase)
            ->where('status', ContractStatus::ACTIVE->value)
            ->count();
        $tenantContractsInactive = max(0, $tenantContractsTotal - $tenantContractsActive);

        return [
            'invoices' => [
                'pending'           => $tenantPending,
                'overdue'           => $tenantOverdue,
                'total_outstanding' => $tenantOutstanding,
                'latest'            => $tenantLatestInvoices,
            ],
            'payments' => [
                'recent' => $tenantRecentPayments,
            ],
            'contracts' => [
                'active'   => $tenantContractsActive,
                'inactive' => $tenantContractsInactive,
                'total'    => $tenantContractsTotal,
            ],
        ];
    }
}
