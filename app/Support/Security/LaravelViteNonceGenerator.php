<?php

namespace App\Support\Security;

use Illuminate\Support\Facades\Vite;
use Spatie\Csp\Nonce\NonceGenerator;

class LaravelViteNonceGenerator implements NonceGenerator
{
    public function generate(): string
    {
        $nonce = Vite::cspNonce();

        if (!$nonce) {
            $nonce = rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '=');
            Vite::useCspNonce($nonce);
        }

        return $nonce;
    }
}
