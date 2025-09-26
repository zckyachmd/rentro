@extends('pdf.layout')

@php
    $__invNumber = data_get($invoice, 'number');
    if (is_array($__invNumber)) {
        $__invNumber = array_key_exists('value', $__invNumber) ? $__invNumber['value'] : (reset($__invNumber) ?: null);
    }
    $__invNumber = (is_string($__invNumber) || is_numeric($__invNumber)) ? (string) $__invNumber : '-';
@endphp
@section('title', (string) __('pdf.receipt.invoice') . ' ' . (string) $__invNumber)

@push('pdf-styles')
<style>
    @page {
        margin: 24px 28px;
    }

        body {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            color: #111;
            font-size: 12px;
        }

        .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 0 4px;
            position: relative;
        }

        .row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
        }

        .col {
            flex: 1 1 0;
        }

        .header {
            margin-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
        }

        .header-row {
            display: grid;
            grid-template-columns: 1fr 380px;
            align-items: start;
            column-gap: 16px;
        }

        .header-row .left {}

        .header-row .right {
            text-align: right;
        }

        .title {
            line-height: 1.1;
            margin: 0;
        }

        .brand {
            margin-bottom: 4px;
            font-size: 16px;
            font-weight: 700;
        }

        .meta-inline .item .label {
            display: block;
            margin-bottom: 2px;
        }

        .meta-inline .item .value {
            font-weight: 700;
        }

        .header-row .left,
        .header-row .right {
            margin-top: 0;
        }

        .meta-inline {
            margin-top: 0;
        }

        .brand {
            margin-top: 0;
        }

        .muted {
            color: #555;
        }

        .mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .4px;
            color: #666;
            margin-bottom: 2px;
        }

        .value {
            font-weight: 600;
        }

        .k-v {
            margin-bottom: 4px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
        }

        th,
        td {
            border: 1px solid #e5e7eb;
            padding: 8px;
        }

        th {
            background: #fafafa;
            text-align: left;
            font-size: 12px;
        }

        td {
            font-size: 12px;
            vertical-align: top;
        }

        .right {
            text-align: right;
        }

        .subtotal {
            font-weight: 700;
            background: #fbfbfb;
        }

        .note {
            color: #666;
            font-size: 11px;
            line-height: 1.5;
        }

        .footer {
            margin-top: 18px;
            border-top: 1px dashed #e5e7eb;
            padding-top: 8px;
            font-size: 11px;
            color: #666;
        }

        .meta-inline {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 14px;
            justify-content: flex-end;
        }

        .meta-inline .item {
            font-size: 12px;
            color: #333;
        }

        .billed-name {
            font-weight: 700;
            font-size: 13px;
            color: #111;
        }

        .badge {
            display: inline-block;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 9999px;
            border: 1px solid #e5e7eb;
        }

        .badge-paid {
            background: #ecfdf5;
            border-color: #10b981;
            color: #065f46;
        }

        .badge-cancelled {
            background: #fef2f2;
            border-color: #ef4444;
            color: #7f1d1d;
        }

        .badge-overdue {
            background: #fff7ed;
            border-color: #f59e0b;
            color: #7c2d12;
        }

        .badge-pending {
            background: #f5f5f5;
            border-color: #d1d5db;
            color: #374151;
        }

        .table-items th,
        .table-items td {
            border: 1px solid #e5e7eb;
            padding: 8px;
        }

        .table-items th {
            background: #fafafa;
            text-align: left;
        }

        .table-items td.right,
        .table-items th.right {
            text-align: right;
        }

        .small-muted {
            color: #666;
            font-size: 11px;
        }
    </style>
@endpush

@push('pdf-scripts')
@if(!empty($autoPrint))
<script>
    window.addEventListener('load', function(){
            try { window.print(); } catch (e) {}
        });
</script>
@endif
@endpush

@php
        $fmt = fn($n) => 'Rp ' . number_format((int) $n, 0, ',', '.');
        $appName = config('app.name');
        $appUrl  = rtrim((string) config('app.url'), '/');
        $fromName = config('mail.from.name');
        $fromAddr = config('mail.from.address');
        $status     = strtolower((string) ($invoice['status'] ?? ''));
        $issuedAt   = !empty($invoice['issued_at']) ? (string) $invoice['issued_at'] : null;
        $dueAt      = !empty($invoice['due_date']) ? (string) $invoice['due_date'] : null;
        $period     = [($invoice['period_start'] ?? null), ($invoice['period_end'] ?? null)];
        $grandTotal = (int) ($invoice['amount_cents'] ?? 0);
        $tenant     = $invoice['tenant'] ?? null;
        $room       = $invoice['room'] ?? null;
        $releaseDay = (int) \App\Models\AppSetting::config('billing.release_day_of_month', 1);

        $formatDate = function ($dateStr) {
            if (!$dateStr) return '—';
            try {
                return \Carbon\Carbon::parse($dateStr)->format('Y-m-d');
            } catch (\Throwable $e) {
                return (string) $dateStr;
            }
        };
@endphp

@section('content')
    <div class="container">
        <!-- Header: Application info (left) and Invoice meta (right) on the same line -->
        <div class="header header-row">
            <div class="left">
                <div class="brand">{{ $appName }}</div>
                @if($appUrl)
                <div class="muted">{{ $appUrl }}</div>
                @endif
                @if($fromName || $fromAddr)
                <div class="muted">{{ trim(($fromName ? ($fromName.' • ') : '').$fromAddr, ' •') }}</div>
                @endif
            </div>
            <div class="right">
                <div class="meta-inline">
                    <div class="item"><span class="label">{{ __('common.number') }}</span> <span class="value">{{ $__invNumber }}</span></div>
                    <div class="item"><span class="label">{{ __('common.issue_date') }}</span> <span class="value">{{ $issuedAt ?: '—'
                            }}</span></div>
                    <div class="item"><span class="label">{{ __('common.due_date') }}</span> <span class="value">{{ $dueAt ?: '—'
                            }}</span></div>

                    <div class="item"><span class="label">{{ __('common.status') }}</span> <span class="value">{{ __('enum.invoice.status.' . strtolower((string)$status)) }}</span></div>
                </div>
            </div>
        </div>

        <!-- Billed To -->
        <div style="margin-bottom: 8px;">
            <div class="label">{{ __('common.billed_to') }}</div>
            <div class="billed-name">{{ $tenant['name'] ?? '—' }}</div>
            @if(!empty($tenant['email']))
            <div class="muted">{{ $tenant['email'] }}</div>
            @endif
            @if(!empty($tenant['phone']))
            <div class="muted">{{ $tenant['phone'] }}</div>
            @endif
        </div>

        <!-- Context: contract, room, period -->
        <div class="muted" style="margin-bottom: 8px;">
            {{ __('invoice.context', [
                'number' => $invoice['contract_id'] ?? '—',
                'room'   => $room['number'] ?? '—',
                'start'  => ($period[0] ?: '—'),
                'end'    => ($period[1] ?: '—'),
            ]) }}
        </div>

        <!-- Items -->
        <table class="table-items">
            <thead>
                <tr>
                    <th style="width:55%">{{ __('common.description') }}</th>
                    <th class="right" style="width:15%">{{ __('common.qty') }}</th>
                    <th class="right" style="width:15%">{{ __('common.unit_price') }}</th>
                    <th class="right" style="width:15%">{{ __('common.subtotal') }}</th>
                </tr>
            </thead>
            <tbody>
                @php($items = (array) ($invoice['items'] ?? []))
                @if(empty($items))
                <tr>
                    <td colspan="4" class="muted">{{ __('invoice.empty') }}</td>
                </tr>
                @else
                @foreach($items as $item)
                @php($meta = (array) ($item['meta'] ?? []))
                @php($code = strtoupper((string) ($item['code'] ?? '')))
                @php($desc = $meta['description'] ?? ($meta['desc'] ?? ($meta['note'] ?? '')))
                @php($dateStart = isset($meta['date_start']) ? (string) $meta['date_start'] : null)
                @php($dateEndInc = isset($meta['date_end']) ? (string) $meta['date_end'] : null)
                @php($endExclusive = $dateEndInc ? \Carbon\Carbon::parse($dateEndInc)->copy()->addDay()->toDateString()
                : null)
                @php($daysFromRange = ($dateStart && $endExclusive) ? max(1, (int)
                \Carbon\Carbon::parse($dateStart)->diffInDays(\Carbon\Carbon::parse($endExclusive))) : null)
                @php($qty = is_numeric($meta['qty'] ?? null) ? (int) $meta['qty'] : ($daysFromRange ?? 1))
                @php($totalDays = is_numeric($meta['days'] ?? null) ? (int) $meta['days'] : null)
                @php($freeDays = is_numeric($meta['free_days'] ?? null) ? (int) $meta['free_days'] : null)
                @php($amount = (int) ($item['amount_cents'] ?? 0))
                @php($unitPrice = is_numeric($meta['unit_price_cents'] ?? null) ? (int) $meta['unit_price_cents'] :
                (int) round($amount / max(1, $qty)))
                @php($isProrata = $code === 'PRORATA' || preg_match('/prorata/i', (string) ($item['label'] ?? '')))
                <tr>
                    <td>
                        <div>
                            @if($code === 'PRORATA')
                                <strong>{{ __('pdf.invoice.item.prorata') }}</strong>
                            @elseif($code === 'RENT')
                                <strong>{{ __('pdf.invoice.item.rent') }}</strong>
                            @else
                                <strong>{{ (string) ($item['label'] ?? '-') }}</strong>
                            @endif
                        </div>
                        @if(!empty($desc))
                        <div class="muted">{{ $desc }}</div>
                        @endif
                        @if($isProrata && ($dateStart || $endExclusive))
                        <div class="small-muted">({{ __('pdf.invoice.item.period_range', ['start' => $formatDate($dateStart), 'end' => $formatDate($endExclusive)]) }})</div>
                        @endif
                        @if($isProrata && !is_null($freeDays) && $freeDays > 0 && !is_null($totalDays))
                        <div class="small-muted">{{ __('pdf.invoice.item.days_summary', ['days' => $totalDays, 'free' => min($freeDays, $totalDays), 'billed' => $qty]) }}</div>
                        @endif
                        @php($unitStr = is_string(($meta['unit'] ?? null)) ? (string) $meta['unit'] : '')
                        @php($unitKey = match (strtolower($unitStr)) { 'hari' => 'day', 'minggu' => 'week', 'bulan' => 'month', default => '' })
                        @if(!$isProrata && !empty($unitKey) && $qty && $unitPrice)
                        <div class="small-muted">{{ __('pdf.invoice.item.qty_line', ['price' => $fmt($unitPrice), 'qty' => $qty, 'unit' => __('pdf.invoice.unit.' . $unitKey)]) }}</div>
                        @endif
                    </td>
                    <td class="right mono">{{ $qty }}</td>
                    <td class="right mono">{{ $fmt($unitPrice) }}</td>
                    <td class="right mono">{{ $fmt($amount) }}</td>
                </tr>
                @endforeach
                <tr class="subtotal">
                    <td class="right" colspan="3">{{ __('common.total') }}</td>
                    <td class="right mono">{{ $fmt($grandTotal) }}</td>
                </tr>
                @endif
            </tbody>
        </table>

        <!-- Notes / Payment Info -->
        <div style="margin-top:12px;" class="note">
            @if($status === 'paid')
            {{ __('common.paid_on', ['date' => (!empty($invoice['paid_at']) ? (string) $invoice['paid_at'] : '—')]) }}
            @elseif($status === 'cancelled')
            {{ __('common.cancelled_invoice') }}
            @else
            {{ __('common.please_pay_before_due') }}
            @endif
        </div>

        <div class="footer">{{ $appName }} — {{ $appUrl }} • {{ __('common.printed_at', ['datetime' => now()->format('Y-m-d H:i')]) }}</div>
    </div>
@endsection
