<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class DiagnosticsController extends Controller
{
    public function proxy(Request $r)
    {
        $token = config('diagnostics.proxy_debug_token');
        if (is_string($token) && $token !== '') {
            $provided = $r->query('t');
            if ($provided === null) {
                $provided = $r->query('token'); // accept alias "token" for convenience
            }
            if ($provided !== $token) {
                abort(403);
            }
        }

        $forwarded = [
            'x-forwarded-proto'  => $r->headers->get('x-forwarded-proto'),
            'x-forwarded-host'   => $r->headers->get('x-forwarded-host'),
            'x-forwarded-port'   => $r->headers->get('x-forwarded-port'),
            'x-forwarded-prefix' => $r->headers->get('x-forwarded-prefix'),
            'x-forwarded-for'    => $r->headers->get('x-forwarded-for'),
            'forwarded'          => $r->headers->get('forwarded'),
        ];

        $requestInfo = [
            'scheme'      => $r->getScheme(),
            'is_secure'   => $r->isSecure(),
            'host'        => $r->getHost(),
            'http_host'   => $r->getHttpHost(),
            'port'        => $r->getPort(),
            'uri'         => $r->getRequestUri(),
            'path'        => $r->path(),
            'full_url'    => $r->fullUrl(),
            'scheme_host' => $r->getSchemeAndHttpHost(),
        ];

        $configInfo = [
            'app_url'     => config('app.url'),
            'force_https' => (bool) config('app.force_https'),
            'asset_url'   => config('app.asset_url'),
        ];

        $urlGen = [
            'url_root'   => url('/'),
            'url_sample' => URL::to('/assets/probe'),
        ];

        return response()->json([
            'forwarded' => $forwarded,
            'request'   => $requestInfo,
            'config'    => $configInfo,
            'urls'      => $urlGen,
        ]);
    }
}
