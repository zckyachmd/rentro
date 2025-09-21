@extends('pdf.layout')

@push('pdf-styles')
<style>
    /* Margin only; paper size set in controller */
    @page {
        margin: 5mm 4mm;
    }

    .container {
        max-width: 100%;
        margin: 0;
    }

    .text-center {
        text-align: center;
    }

    .brand {
        font-size: 12px;
        line-height: 1.2;
    }

    .muted {
        font-size: 9.5px;
        line-height: 1.2;
    }

    .divider {
        margin: 4px 0;
    }

    .table-sm td,
    .table-sm th {
        padding: 2px 0;
    }

    .amount {
        font-weight: 700;
        font-size: 12px;
    }

    .badge {
        padding: 0 4px;
        border-radius: 6px;
        font-size: 9.5px;
    }

    .footnote {
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px dashed #bbb;
        font-size: 9.5px;
    }

    .cutline {
        border-top: 1px dashed #bbb;
        margin-top: 6px;
    }
</style>
@endpush

@php
$appName = config('app.name');
$appUrl = rtrim((string) config('app.url'), '/');
$fromName = config('mail.from.name');
$fromAddr = config('mail.from.address');
$fmt = fn($n) => 'Rp ' . number_format((int) $n, 0, ',', '.');
$now = now()->format('Y-m-d H:i');
@endphp

@section('title', 'Kwitansi Pembayaran')

@section('content')
<div class="center">
    <div class="brand">{{ $appName }}</div>
    @if($appUrl)
    <div class="muted">{{ $appUrl }}</div>
    @endif
    @if($fromName || $fromAddr)
    <div class="muted">{{ trim(($fromName ? ($fromName.' • ') : '').$fromAddr, ' •') }}</div>
    @endif
</div>
<div class="divider"></div>

<table class="table table-sm">
    <tbody>
        @if(!empty($invoice['number']))
        <tr>
            <td>Invoice</td>
            <td class="text-end mono">{{ $invoice['number'] }}</td>
        </tr>
        @endif
        <tr>
            <td>Metode</td>
            <td class="text-end">{{ $payment['method'] ?? '-' }}</td>
        </tr>
        <tr>
            <td>Tanggal Bayar</td>
            <td class="text-end">{{ $payment['paid_at'] ?? '-' }}</td>
        </tr>
        @if(!empty($payment['reference']))
        <tr>
            <td>Referensi</td>
            <td class="text-end mono">{{ $payment['reference'] }}</td>
        </tr>
        @endif
        @isset($recorded_by)
        <tr>
            <td>Dicatat oleh</td>
            <td class="text-end">{{ $recorded_by }}</td>
        </tr>
        @endisset
    </tbody>
</table>

@if(!empty($tenant['name']) || !empty($room['number']) || !empty($tenant['phone']))
<div class="divider"></div>
<table class="table table-sm">
    <tbody>
        @if(!empty($tenant['name']))
        <tr>
            <td>Penyewa</td>
            <td class="text-end">{{ $tenant['name'] }}</td>
        </tr>
        @endif
        @if(!empty($room['number']) || !empty($room['name']))
        <tr>
            <td>Kamar</td>
            <td class="text-end">{{ ($room['number'] ?? '') }} {{ ($room['name'] ?? '') }}</td>
        </tr>
        @endif
    </tbody>
</table>
@endif

@isset($summary)
<div class="divider"></div>
<table class="table table-sm">
    <tbody>
        <tr>
            <td>Total Tagihan</td>
            <td class="text-end">{{ $fmt($summary['total_invoice'] ?? 0) }}</td>
        </tr>
        <tr>
            <td>Sisa Sebelum</td>
            <td class="text-end">{{ $fmt($summary['pre_outstanding'] ?? 0) }}</td>
        </tr>
        <tr>
            <td>Dibayar Saat Ini</td>
            <td class="text-end fw-bold">{{ $fmt($summary['current_paid'] ?? 0) }}</td>
        </tr>
        <tr>
            <td>Sisa Setelah</td>
            <td class="text-end">{{ $fmt($summary['post_outstanding'] ?? 0) }}</td>
        </tr>
    </tbody>
</table>
@endisset

<div class="footnote">
    Dicetak {{ $now }} • Simpan struk ini sebagai bukti pembayaran.
</div>
<div class="cutline"></div>
@endsection
