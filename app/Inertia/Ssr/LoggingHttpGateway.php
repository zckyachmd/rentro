<?php

namespace App\Inertia\Ssr;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Ssr\HasHealthCheck;
use Inertia\Ssr\Response as SsrResponse;

class LoggingHttpGateway extends \Inertia\Ssr\HttpGateway implements \Inertia\Ssr\Gateway, HasHealthCheck
{
    /**
     * Dispatch the Inertia page to the SSR engine via HTTP with timeouts and logging.
     *
     * @param  array<string, mixed>  $page
     */
    public function dispatch(array $page): ?SsrResponse
    {
        if (! $this->shouldDispatch()) {
            return null;
        }

        $connect = (float) env('INERTIA_SSR_CONNECT_TIMEOUT', 1.0);
        $timeout = (float) env('INERTIA_SSR_TIMEOUT', 2.0);
        $start = microtime(true);

        try {
            $response = Http::connectTimeout($connect)
                ->timeout($timeout)
                ->post($this->getUrl('/render'), $page);

            if (! $response->successful()) {
                $dur = (int) ((microtime(true) - $start) * 1000);
                Log::channel('ssr')->warning('SSR non-success response', [
                    'status' => $response->status(),
                    'duration_ms' => $dur,
                    'url' => $this->getUrl('/render'),
                ]);
                return null;
            }

            $json = $response->json();
            if (is_null($json)) {
                return null;
            }

            return new SsrResponse(
                implode("\n", $json['head']),
                $json['body']
            );
        } catch (Exception $e) {
            $dur = (int) ((microtime(true) - $start) * 1000);
            Log::channel('ssr')->warning('SSR exception', [
                'error' => $e->getMessage(),
                'duration_ms' => $dur,
                'url' => $this->getUrl('/render'),
            ]);
            return null;
        }
    }

    /**
     * Determine if the SSR server is healthy with timeouts.
     */
    public function isHealthy(): bool
    {
        $connect = (float) env('INERTIA_SSR_CONNECT_TIMEOUT', 1.0);
        $timeout = (float) env('INERTIA_SSR_TIMEOUT', 2.0);
        return Http::connectTimeout($connect)
            ->timeout($timeout)
            ->get($this->getUrl('/health'))
            ->successful();
    }
}

