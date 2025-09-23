@extends('pdf.layout')

@php
    $c = $contract ?? [];
    $t = $c['tenant'] ?? null;
    $r = $c['room'] ?? null;
@endphp

@section('title', 'Kontrak ' . ($c['number'] ?? '-'))

@push('pdf-styles')
<style>
    @page { margin: 24px 28px; }
    .header { margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
    .header-row { display: grid; grid-template-columns: 1fr 360px; column-gap: 16px; }
    .meta-inline { display: flex; flex-wrap: wrap; gap: 8px 14px; justify-content: flex-end; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: .4px; color: #666; margin-bottom: 2px; }
    .value { font-weight: 600; }
    .k-v { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #fafafa; text-align: left; }
    .note { color: #666; font-size: 11px; line-height: 1.5; }
    .footer { margin-top: 16px; border-top: 1px dashed #e5e7eb; padding-top: 8px; font-size: 11px; color: #666; }
    .title { margin: 0; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    .section { margin-top: 14px; }
    .small { font-size: 11px; color: #666; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 6px; border-radius: 9999px; border: 1px solid #e5e7eb; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 16px; }
</style>
@endpush

@section('content')
<div class="header">
    <div class="header-row">
        <div class="left">
            <div class="brand">{{ config('app.name') }}</div>
            <h2 class="title">Kontrak <span class="mono">{{ $c['number'] ?? '-' }}</span></h2>
            <div class="small">Status: {{ isset($c['status']) ? __('enum.contract.status.' . strtolower((string)$c['status'])) : '-' }}</div>
        </div>
        <div class="right">
            <div class="meta-inline">
                <div class="item">
                    <div class="label">Mulai</div>
                    <div class="value">{{ $c['start_date'] ?? '-' }}</div>
                </div>
                <div class="item">
                    <div class="label">Berakhir</div>
                    <div class="value">{{ $c['end_date'] ?? '-' }}</div>
                </div>
                <div class="item">
                    <div class="label">Periode Tagih</div>
                    <div class="value">
                        @if(!empty($c['billing_period']))
                            {{ __('enum.billing_period.' . strtolower((string)$c['billing_period'])) }}
                        @else
                            -
                        @endif
                        @if(!empty($c['billing_day'])) <span class="small">(tgl {{ $c['billing_day'] }})</span> @endif
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="grid-2">
    <div class="section">
        <div class="label">Penyewa</div>
        <div class="k-v"><span class="value">{{ $t['name'] ?? '-' }}</span></div>
        <div class="k-v">Email: {{ $t['email'] ?? '-' }}</div>
        <div class="k-v">Telepon: {{ $t['phone'] ?? '-' }}</div>
    </div>
    <div class="section">
        <div class="label">Kamar</div>
        <div class="k-v"><span class="value">{{ $r['number'] ?? '-' }}</span> — {{ $r['name'] ?? '-' }}</div>
        <div class="k-v">Gedung: {{ $r['building'] ?? '-' }} &middot; Lantai: {{ $r['floor'] ?? '-' }}</div>
        <div class="k-v">Tipe: {{ $r['type'] ?? '-' }}</div>
    </div>
</div>

<div class="section">
    <div class="label">Nilai & Ketentuan</div>
    <table>
        <tbody>
            <tr>
                <th style="width: 40%">Sewa</th>
                <td class="mono">Rp {{ number_format((int)($c['rent_cents'] ?? 0)/100, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <th>Deposit</th>
                <td class="mono">Rp {{ number_format((int)($c['deposit_cents'] ?? 0)/100, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <th>Periode Tagih</th>
                <td>
                    @if(!empty($c['billing_period']))
                        {{ __('enum.billing_period.' . strtolower((string)$c['billing_period'])) }}
                    @else
                        -
                    @endif
                    @if(!empty($c['billing_day'])) <span class="small"> (tanggal tagih: {{ $c['billing_day'] }})</span>@endif
                </td>
            </tr>
        </tbody>
    </table>
</div>

@if(!empty($c['notes']))
<div class="section">
    <div class="label">Catatan</div>
    <div class="note">{!! nl2br(e($c['notes'])) !!}</div>
    </div>
@endif

<div class="footer">
    Dicetak pada {{ now()->format('Y-m-d H:i') }} &middot; {{ config('app.name') }}
    @if(!empty($autoPrint))
        <script>window.print && window.print()</script>
    @endif
</div>
@endsection
