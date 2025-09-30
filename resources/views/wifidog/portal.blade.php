@php
  /** @var \App\Models\WifiSession $session */
  $user = $user ?? null;
  $gateway = $gateway ?? null;
  $policy = $policy ?? null;
  $usage = $usage ?? [];
  $ssid = $session->meta['ssid'] ?? null;
  $bytesTotal = (int)($session->bytes_in + $session->bytes_out);
  $fmtBytes = function (int $b): string {
    if ($b >= 1099511627776) return number_format($b/1099511627776, 2).' TB';
    if ($b >= 1073741824)    return number_format($b/1073741824, 2).' GB';
    if ($b >= 1048576)       return number_format($b/1048576, 1).' MB';
    if ($b >= 1024)          return number_format($b/1024, 0).' KB';
    return $b.' B';
  };
  $fmtDur = function (int $s): string {
    $s = max(0, $s);
    $h = floor($s/3600); $m = floor(($s%3600)/60); $sec = $s%60;
    return sprintf('%02d:%02d:%02d', $h, $m, $sec);
  };
@endphp

@extends('layouts.portal')

@section('content')
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="bg-card text-card-foreground border border-input rounded-lg shadow-sm p-6">
      <h1 class="text-xl font-semibold mb-1">Status Koneksi</h1>
      <p class="text-sm text-muted-foreground mb-4">Anda online melalui gateway Wi‑Fi.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div class="text-xs text-muted-foreground">Pengguna</div>
          <div class="text-sm font-medium">{{ $user?->name }} <span class="text-muted-foreground">({{ $user?->email }})</span></div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">SSID / Gateway</div>
          <div class="text-sm font-medium">{{ $ssid ?: ($gateway?->name ?: $gateway?->gw_id) }}</div>
          @if(($gateway?->meta['location'] ?? null))
            <div class="text-xs text-muted-foreground">Lokasi: {{ $gateway->meta['location'] }}</div>
          @endif
        </div>
        <div>
          <div class="text-xs text-muted-foreground">IP / MAC</div>
          <div class="text-sm font-medium">{{ $session->ip }} / {{ $session->mac }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Uptime</div>
          <div class="text-sm font-medium">{{ $fmtDur((int)$session->uptime) }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">Status</div>
          <div class="text-sm font-medium uppercase">{{ $session->status }}</div>
        </div>
      </div>

      <div class="mt-6 border-t border-border pt-4">
        <div class="text-sm font-medium mb-2">Pemakaian</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          @foreach(['daily' => 'Harian', 'weekly' => 'Mingguan', 'monthly' => 'Bulanan'] as $k => $label)
            @php $u = $usage[$k] ?? null; @endphp
            <div class="rounded-md border border-input p-3">
              <div class="text-xs text-muted-foreground">{{ $label }}</div>
              @if($u)
                <div class="text-sm font-medium">{{ $fmtBytes((int)$u['used']) }} / {{ $fmtBytes((int)$u['limit']) }}</div>
              @else
                <div class="text-sm text-muted-foreground">-</div>
              @endif
            </div>
          @endforeach
        </div>
        <div class="mt-3 text-xs text-muted-foreground">Total sesi: {{ $fmtBytes($bytesTotal) }}</div>
      </div>

      <div class="mt-6 flex items-center gap-3">
        <form method="POST" action="{{ route('wifidog.logout') }}" class="inline-flex">
          @csrf
          <input type="hidden" name="token" value="{{ $session->token }}">
          <input type="hidden" name="mac" value="{{ $session->mac }}">
          <button type="submit" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-4 py-2 text-sm font-medium">
            Logout
          </button>
        </form>
        <a href="{{ route('home') }}" class="inline-flex items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-4 py-2 text-sm font-medium">
          Kembali ke jaringan
        </a>
      </div>
    </div>
  </div>
@endsection
