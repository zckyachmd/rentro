<?php

namespace App\Http\Middleware;

use App\Models\WifiGateway;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrustedGateway
{
    public function handle(Request $request, Closure $next): Response
    {
        $path    = $request->path(); // e.g. wifidog/auth
        $isPing  = str_starts_with($path, 'wifidog/ping');
        $isAuth  = str_starts_with($path, 'wifidog/auth');
        $isLogin = str_starts_with($path, 'wifidog/login');

        // ambil parameter gateway
        $gwId  = $request->query('gw_id') ?? $request->input('gw_id');
        $gwMac = strtoupper((string) ($request->query('gw_mac') ?? $request->input('gw_mac') ?? ''));
        $srcIp = $request->ip();

        // /wifidog/ping bisa diizinkan meskipun gw belum terdaftar (opsional via config)
        if ($isPing && config('wifidog.allow_unknown_ping', true)) {
            return $next($request);
        }

        // selain ping, gw_id wajib ada & dikenal
        if (!$gwId) {
            return $this->deny($request, $isAuth, reason: 'missing_gw_id');
        }

        $gateway = WifiGateway::where('gw_id', $gwId)->first();
        if (!$gateway) {
            return $this->deny($request, $isAuth, reason: 'unknown_gateway');
        }

        // untuk /wifidog/login: jangan cek IP (karena request berasal dari klien/UA)
        $enforceIp = config('wifidog.enforce_source_ip', true) && ($isAuth || $isPing);
        if ($enforceIp && $gateway->mgmt_ip && $gateway->mgmt_ip !== $srcIp) {
            return $this->deny($request, $isAuth, reason: 'ip_mismatch');
        }

        // opsional: cocokkan MAC gateway bila disediakan
        if (config('wifidog.enforce_gateway_mac', false) && $gwMac && $gateway->mac_address) {
            if (strtoupper($gateway->mac_address) !== $gwMac) {
                return $this->deny($request, $isAuth, reason: 'mac_mismatch');
            }
        }

        // lolos
        return $next($request);
    }

    private function deny(Request $request, bool $isAuth, string $reason): Response
    {
        // Untuk endpoint AUTH, WiFiDog mengharapkan plaintext "Auth: 0"
        if ($isAuth) {
            return response('Auth: 0', 200)->header('Content-Type', 'text/plain');
        }

        // Untuk POST counters (jika masuk ke sini), balas JSON minimal agar gateway tidak nge-hang
        if ($request->isMethod('post')) {
            return response(['resp' => [], 'reason' => $reason], 200)->header('Content-Type', 'application/json');
        }

        // Default: 403 JSON agar gampang didiagnosa ketika diakses manual
        return response()->json(['ok' => false, 'reason' => $reason], 403);
    }
}
