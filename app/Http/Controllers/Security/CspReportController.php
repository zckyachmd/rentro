<?php

namespace App\Http\Controllers\Security;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CspReportController
{
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->json()->all();
        if (empty($payload)) {
            $raw     = $request->getContent();
            $payload = ['raw' => $raw];
        }

        Log::channel('csp')->info('CSP violation report', [
            'ip'         => $request->ip(),
            'user_agent' => $request->userAgent(),
            'payload'    => $payload,
        ]);

        return response()->json(null, 204);
    }
}
