<?php

namespace App\Http\Controllers;

use App\Models\WifiGateway;
use App\Models\WifiPolicy;
use App\Models\WifiSession;
use App\Services\Contracts\WifiServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WifiDogController extends Controller
{
    public function __construct(private readonly WifiServiceInterface $wifi)
    {
    }

    /**
     * Gateway heartbeat. Spec expects plaintext "Pong"
     * Ref: WiFiDog protocol v1.
     */
    public function ping(Request $r)
    {
        $gwId = $r->query('gw_id');
        $mac  = $r->query('gw_mac') ?? $r->query('mac');

        $gateway = $gwId
            ? WifiGateway::where('gw_id', $gwId)->first()
            : null;

        if ($gateway) {
            $gateway->last_ping_at = now();
            if ($r->filled('sys_uptime')) {
                $gateway->sys_uptime = (int) $r->query('sys_uptime');
            }
            if ($r->filled('sys_load')) {
                $gateway->sys_load = (float) $r->query('sys_load');
            }
            if (!$gateway->mac_address && $mac) {
                $gateway->mac_address = strtoupper($mac);
            }
            $gateway->save();
        } else {
            if ($gwId || $mac) {
                Log::warning('WiFiDog PING from unknown gateway', [
                    'gw_id'  => $gwId,
                    'gw_mac' => $mac,
                    'ip'     => $r->ip(),
                ]);
            }
        }

        return response('Pong', 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Captive login endpoint.
     * - GET: if not logged in -> show captive form; if logged in -> show connecting state and auto-provision.
     * - POST: handle credentials; on success redirect back to GET with provision=1 to issue token & redirect to gateway.
     */
    public function login(Request $r)
    {
        // Accept both query (GET) and body (POST) for gateway parameters
        $gwId      = $r->input('gw_id', $r->query('gw_id'));
        $gwAddress = $r->input('gw_address', $r->query('gw_address'));
        $gwPort    = (int) ($r->input('gw_port', $r->query('gw_port', 80)));
        $clientMac = strtoupper((string) ($r->input('mac', $r->query('mac'))));
        $clientIp  = $r->input('ip', $r->query('ip'));
        $ssid      = $r->input('ssid', $r->query('ssid'));

        $gateway = $gwId ? WifiGateway::where('gw_id', $gwId)->first() : null;
        if (!$gateway) {
            abort(403, 'Gateway not recognized');
        }

        // Stash context for post-login flow
        session([
            'wifidog' => [
                'gw_id'      => $gwId,
                'gw_address' => $gwAddress,
                'gw_port'    => $gwPort,
                'mac'        => $clientMac,
                'ip'         => $clientIp,
                'ssid'       => $ssid,
            ],
        ]);

        // POST: handle credentials
        if ($r->isMethod('post')) {
            $r->validate([
                'email'      => ['required', 'email'],
                'password'   => ['required', 'string'],
                'gw_id'      => ['required', 'string'],
                'gw_address' => ['required', 'string'],
                'gw_port'    => ['required'],
                'mac'        => ['required', 'string'],
            ]);

            if (!auth()->attempt(['email' => $r->input('email'), 'password' => $r->input('password')])) {
                return back()->withErrors(['email' => __('auth.failed')])->withInput($r->except('password'));
            }
            $r->session()->regenerate();

            return redirect()->route('wifi.login', [
                'gw_id'      => $gwId,
                'gw_address' => $gwAddress,
                'gw_port'    => $gwPort,
                'mac'        => $clientMac,
                'ip'         => $clientIp,
                'ssid'       => $ssid,
                'provision'  => 1,
            ]);
        }

        // GET flow
        if (!auth()->check()) {
            return view('wifidog.login', [
                'gw' => [
                    'gw_id'      => $gwId,
                    'gw_address' => $gwAddress,
                    'gw_port'    => $gwPort,
                    'clientMac'  => $clientMac,
                    'clientIp'   => $clientIp,
                    'ssid'       => $ssid,
                ],
                'autoprovisionUrl' => null,
                'title'            => 'Login Wi‑Fi',
            ]);
        }

        // If already logged in: either render connecting screen or provision & redirect
        if ($r->boolean('provision')) {
            $user   = auth()->user();
            $policy = WifiPolicy::where('is_active', true)->whereJsonContains('meta->roles', $user->getRoleNames()->first() ?? 'Tenant')->first()
                ?? $this->wifi->selectPolicyForUser($user);

            $token = Str::random(40);
            WifiSession::create([
                'user_id'      => $user->id,
                'gateway_id'   => $gateway->id,
                'policy_id'    => $policy?->id,
                'mac'          => $clientMac,
                'ip'           => $clientIp,
                'token'        => $token,
                'status'       => \App\Enum\WifiSessionStatus::PENDING,
                'started_at'   => now(),
                'last_seen_at' => now(),
                'meta'         => ['ssid' => $ssid],
            ]);

            $redirectUrl = sprintf('http://%s:%s/wifidog/auth?token=%s', $gwAddress, $gwPort, $token);

            return redirect()->away($redirectUrl);
        }

        $autoUrl = route('wifi.login', array_merge($r->query(), ['provision' => 1]));

        return view('wifidog.login', [
            'gw' => [
                'gw_id'      => $gwId,
                'gw_address' => $gwAddress,
                'gw_port'    => $gwPort,
                'clientMac'  => $clientMac,
                'clientIp'   => $clientIp,
                'ssid'       => $ssid,
            ],
            'autoprovisionUrl' => $autoUrl,
            'title'            => 'Menghubungkan…',
        ]);
    }

    /**
     * GET  /wifidog/auth -> validate token and return plaintext "Auth: 1" or "Auth: 0"
     * POST /wifidog/auth -> counters update (JSON), respond with {"resp":[{"mac":"..","auth":1|0},...]}
     * Ref: WiFiDog-ng docs.
     */
    public function auth(Request $r)
    {
        if ($r->isMethod('post')) {
            $payload   = $r->json()->all();
            $responses = [];

            foreach ($payload['counters'] ?? [] as $c) {
                $token    = $c['token'] ?? null;
                $mac      = strtoupper((string) ($c['mac'] ?? ''));
                $incoming = (int) ($c['incoming'] ?? 0);
                $outgoing = (int) ($c['outgoing'] ?? 0);
                $uptime   = isset($c['uptime']) ? (int) $c['uptime'] : null;

                $session = WifiSession::where('token', $token)->where('mac', $mac)->first();

                $auth = 0;
                if ($session && $session->status === \App\Enum\WifiSessionStatus::AUTH) {
                    // Update aggregates on the session
                    $session->applyCounters($incoming, $outgoing, $uptime);

                    // Evaluate policy (rolling windows / hard cap)
                    $result = $this->wifi->evaluateSession($session);
                    if ($result['allowed']) {
                        $auth = 1;
                    } else {
                        $session->revoke($result['reason'] ?? 'policy_denied');
                        $auth = 0;
                    }
                }

                $responses[] = ['mac' => $mac, 'auth' => $auth];
            }

            return response(['resp' => $responses], 200)->header('Content-Type', 'application/json');
        }

        // GET stage: token validate
        $token   = $r->query('token');
        $session = $token ? WifiSession::where('token', $token)->first() : null;

        $allow = false;
        if ($session) {
            if (!$session->policy && $session->user) {
                $user = $session->user;
                if ($user instanceof \App\Models\User) {
                    if ($policy = $this->wifi->selectPolicyForUser($user)) {
                        $session->policy()->associate($policy);
                        $session->save();
                    }
                }
            }

            $result = $this->wifi->evaluateSession($session);
            if ($result['allowed']) {
                $allow = true;
                if ($session->status !== \App\Enum\WifiSessionStatus::AUTH) {
                    $session->status = \App\Enum\WifiSessionStatus::AUTH;
                    $session->save();
                }
            } else {
                $session->revoke($result['reason'] ?? 'policy_denied');
            }
        }

        return response('Auth: ' . ($allow ? '1' : '0'), 200)
            ->header('Content-Type', 'text/plain');
    }

    /**
     * Portal page: show session status, usage, and logout button.
     */
    public function portal(Request $r)
    {
        // Prefer session resolved by middleware (PortalAccess)
        $session = $r->attributes->get('wifidog_session');
        $token   = $r->query('token');
        if (!$session && $token) {
            $session = WifiSession::where('token', $token)->first();
        }
        // Fallback: find by client IP (most recent active)
        if (!$session) {
            $session = WifiSession::where('ip', $r->ip())
                ->orderByDesc('last_seen_at')
                ->first();
        }
        // Fallback: if user logged in, pick their latest session
        if (!$session && auth()->check()) {
            $session = WifiSession::where('user_id', auth()->id())
                ->orderByDesc('last_seen_at')
                ->first();
        }

        if (!$session || in_array($session->status, [\App\Enum\WifiSessionStatus::REVOKED, \App\Enum\WifiSessionStatus::EXPIRED, \App\Enum\WifiSessionStatus::BLOCKED], true)) {
            return redirect()->route('wifidog.login');
        }

        $eval  = $this->wifi->evaluateSession($session);
        $usage = $eval['windowsUsage'] ?? [];

        return view('wifidog.portal', [
            'user'    => $session->user,
            'policy'  => $session->policy,
            'session' => $session,
            'gateway' => $session->gateway,
            'usage'   => $usage,
            'title'   => 'Portal Wi‑Fi',
        ]);
    }

    /**
     * Server-side logout (kick). Next auth/counters will be denied.
     */
    public function logout(Request $r)
    {
        $token   = $r->input('token');
        $mac     = strtoupper((string) $r->input('mac'));
        $session = WifiSession::when($token, fn ($q) => $q->where('token', $token))
            ->when($mac, fn ($q) => $q->where('mac', $mac))
            ->orderByDesc('id')->first();

        // Safety: only allow logout by same user or same client IP
        if ($session && (auth()->id() === $session->user_id || $r->ip() === $session->ip)) {
            $session->revoke('logout');
        } else {
            $session = null;
        }

        if ($r->expectsJson()) {
            return response()->json(['ok' => (bool) $session]);
        }

        return redirect()->route('wifidog.login')->with('status', __('Koneksi diputus'));
    }
}
