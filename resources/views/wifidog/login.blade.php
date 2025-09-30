@php
  /** @var array|null $gw */
  $gw = $gw ?? null;
  $autoUrl = $autoprovisionUrl ?? null;
  $ssid = $gw['ssid'] ?? request('ssid');
  $gwName = $gw['gw_id'] ?? null;
@endphp

@extends('layouts.portal')

@section('content')
  @if (session('status'))
    <div class="max-w-md mx-auto mb-4">
      <div class="rounded-md border border-input bg-accent text-accent-foreground px-4 py-3 text-sm">
        {{ session('status') }}
      </div>
    </div>
  @endif
  @if($autoUrl)
    <meta http-equiv="refresh" content="1;url={{ $autoUrl }}">
    <div class="max-w-md mx-auto">
      <div class="bg-card text-card-foreground border border-input rounded-lg shadow-sm p-6">
        <h1 class="text-xl font-semibold mb-2">Menghubungkan…</h1>
        <p class="text-sm text-muted-foreground mb-4">Anda sudah login. Mengaktifkan akses Internet melalui gateway.</p>
        @if($ssid || $gwName)
          <p class="text-sm mb-4">Jaringan: <span class="font-medium">{{ $ssid ?: $gwName }}</span></p>
        @endif
        <div class="flex items-center gap-3">
          <a href="{{ $autoUrl }}" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-4 py-2 text-sm font-medium">
            Lanjutkan sekarang
          </a>
          <a href="{{ route('wifidog.portal') }}" class="inline-flex items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-4 py-2 text-sm font-medium">
            Buka Portal Status
          </a>
        </div>
      </div>
    </div>
  @else
    <div class="max-w-md mx-auto">
      <div class="bg-card text-card-foreground border border-input rounded-lg shadow-sm p-6">
        <h1 class="text-xl font-semibold mb-2">Login Wi‑Fi</h1>
        <p class="text-sm text-muted-foreground mb-4">Setelah login, Anda akan diarahkan agar koneksi dibuka oleh gateway.</p>

        <form method="POST" action="{{ route('wifidog.login') }}" class="space-y-4">
          @csrf
          <input type="hidden" name="gw_id" value="{{ old('gw_id', $gw['gw_id'] ?? request('gw_id')) }}">
          <input type="hidden" name="gw_address" value="{{ old('gw_address', $gw['gw_address'] ?? request('gw_address')) }}">
          <input type="hidden" name="gw_port" value="{{ old('gw_port', $gw['gw_port'] ?? request('gw_port', 80)) }}">
          <input type="hidden" name="mac" value="{{ old('mac', $gw['clientMac'] ?? request('mac')) }}">
          <input type="hidden" name="ip" value="{{ old('ip', $gw['clientIp'] ?? request('ip')) }}">
          <input type="hidden" name="ssid" value="{{ old('ssid', $ssid) }}">

          <div>
            <label for="email" class="block text-sm font-medium mb-1">Email</label>
            <input id="email" name="email" type="email" inputmode="email" autocomplete="username" required
                   class="block w-full rounded-md bg-background text-foreground border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                   value="{{ old('email') }}">
            @error('email')
              <p class="mt-1 text-sm text-destructive">{{ $message }}</p>
            @enderror
          </div>

          <div>
            <label for="password" class="block text-sm font-medium mb-1">Kata sandi</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required
                   class="block w-full rounded-md bg-background text-foreground border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            @error('password')
              <p class="mt-1 text-sm text-destructive">{{ $message }}</p>
            @enderror
          </div>

          <button type="submit" class="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-4 py-2 text-sm font-medium">
            Masuk & Sambungkan
          </button>
        </form>

        @if($ssid || $gwName)
          <p class="mt-4 text-xs text-muted-foreground">Terhubung ke: <span class="font-medium">{{ $ssid ?: $gwName }}</span></p>
        @endif
      </div>
    </div>
  @endif
@endsection
