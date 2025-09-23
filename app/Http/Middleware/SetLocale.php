<?php

namespace App\Http\Middleware;

use App\Enum\Locale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * Resolve locale from cookie `locale`, then request header, then config.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supported = array_map(fn (Locale $c) => $c->value, Locale::cases());

        $locale = (string) $request->cookie('locale', '');
        if (!in_array($locale, $supported, true)) {
            try {
                // Use data_get to safely access preferences even if user is null
                $prefs = (array) data_get($request->user(), 'preferences', []);
                $cand  = (string) ($prefs['locale'] ?? '');
                if (in_array($cand, $supported, true)) {
                    $locale = $cand;
                }
            } catch (\Throwable) {
                // ignore
            }
        }

        if (!in_array($locale, $supported, true)) {
            $locale = $this->fromAcceptLanguage($request, $supported) ?? config('app.locale', 'en');
        }

        app()->setLocale((string) $locale);
        try {
            \Carbon\Carbon::setLocale($locale);
        } catch (\Throwable) {
            // ignore
        }

        $response = $next($request);
        try {
            $response->headers->set('Content-Language', (string) $locale);
        } catch (\Throwable) {
            // ignore
        }

        return $response;
    }

    private function fromAcceptLanguage(Request $request, array $supported): ?string
    {
        $header = (string) $request->header('Accept-Language', '');
        if ($header === '') {
            return null;
        }
        $parts = preg_split('/\s*,\s*/', $header) ?: [];

        $candidates = [];
        $order      = 0;
        foreach ($parts as $p) {
            $order++;
            $seg = trim($p);
            if ($seg === '') {
                continue;
            }
            $langAndParams = explode(';', $seg);
            $code          = strtolower(trim($langAndParams[0] ?? ''));
            if ($code === '') {
                continue;
            }
            $q = 1.0;
            foreach (array_slice($langAndParams, 1) as $param) {
                [$k, $v] = array_map('trim', array_pad(explode('=', $param, 2), 2, ''));
                if ($k === 'q' && is_numeric($v)) {
                    $q = max(0.0, min(1.0, (float) $v));
                }
            }
            $base   = explode('-', $code)[0] ?? $code;
            $mapped = null;
            foreach ($supported as $s) {
                if ($s === $code || $s === $base) {
                    $mapped = $s;
                    break;
                }
            }
            if ($mapped) {
                $candidates[] = ['code' => $mapped, 'q' => $q, 'order' => $order];
            }
        }

        if (empty($candidates)) {
            return null;
        }
        usort($candidates, function ($a, $b) {
            if ($a['q'] === $b['q']) {
                return $a['order'] <=> $b['order'];
            }

            return $a['q'] < $b['q'] ? 1 : -1;
        });

        return $candidates[0]['code'];
    }
}
