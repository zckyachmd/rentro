<?php

namespace App\Http\Middleware;

use App\Models\WifiSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PortalAccess
{
    /**
     * Ensure user is logged in and has an active WifiSession.
     * If not, redirect to captive login.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect()->route('wifi.login', $request->query());
        }

        $session  = null;
        $clientIp = $request->ip();

        if ($token = $request->query('token')) {
            $session = WifiSession::active()->where('token', $token)->first();
            if (!$session || $session->ip !== $clientIp) {
                return redirect()->route('wifi.login');
            }
        }

        if (!$session) {
            $session = WifiSession::where('user_id', auth()->id())
                ->where('ip', $clientIp)
                ->active()
                ->orderByDesc('last_seen_at')
                ->first();
        }

        if (!$session) {
            return redirect()->route('wifi.login');
        }

        // Attach to request for downstream usage
        $request->attributes->set('wifidog_session', $session);

        return $next($request);
    }
}
