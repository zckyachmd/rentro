<?php

namespace App\Services;

use App\Services\Contracts\TwoFactorServiceInterface;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Crypt;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService implements TwoFactorServiceInterface
{
    private int $window;
    private int $qrSize;
    private string $defaultIssuer;
    private int $digits;
    private int $period;
    private string $algorithm;

    public function __construct(private readonly Google2FA $g2fa)
    {
        $this->window        = (int) config('twofactor.window', 8);
        $this->qrSize        = (int) config('twofactor.qr_size', 240);
        $this->defaultIssuer = (string) (config('twofactor.issuer') ?? config('app.name', 'App'));
        $this->digits        = (int) config('twofactor.digits', 6);
        $this->period        = (int) config('twofactor.period', 30);
        $this->algorithm     = (string) config('twofactor.algorithm', 'SHA1');
        $this->g2fa->setOneTimePasswordLength($this->digits);
        $this->g2fa->setKeyRegeneration($this->period);
    }

    public function generateSecret(int $length = 32): string
    {
        return $this->g2fa->generateSecretKey($length);
    }

    public function getOtpAuthUrl(string $issuer, string $accountName, string $secret): string
    {
        $issuerToUse = $issuer !== '' ? $issuer : $this->defaultIssuer;

        $label = rawurlencode($issuerToUse . ':' . $accountName);
        $query = http_build_query([
            'secret'    => $secret,
            'issuer'    => $issuerToUse,
            'algorithm' => strtoupper($this->algorithm),
            'digits'    => $this->digits,
            'period'    => $this->period,
        ], '', '&', PHP_QUERY_RFC3986);

        return "otpauth://totp/{$label}?{$query}";
    }

    public function makeQrSvg(string $otpauthUrl, int $size = null): string
    {
        $size     = $size ?? $this->qrSize;
        $renderer = new ImageRenderer(
            new RendererStyle($size, 1, null),
            new SvgImageBackEnd(),
        );
        $writer = new Writer($renderer);

        return $writer->writeString($otpauthUrl);
    }

    public function verify(string $secret, string $code): bool
    {
        $code = preg_replace('/\D+/', '', (string) $code) ?? '';
        if (strlen($code) !== $this->digits) {
            return false;
        }

        return (bool) $this->g2fa->verifyKey($secret, $code, $this->window);
    }

    public function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(4))) . '-' . strtoupper(bin2hex(random_bytes(4)));
        }

        return $codes;
    }

    public function makeQrSvgFromParts(string $accountName, string $secret, ?string $issuer = null, ?int $size = null): string
    {
        $otpauth = $this->getOtpAuthUrl($issuer ?? $this->defaultIssuer, $accountName, $secret);

        return $this->makeQrSvg($otpauth, $size ?? $this->qrSize);
    }

    public function normalizeRecoveryCode(string $code): string
    {
        $clean = preg_replace('/[^A-Za-z0-9-]+/', '', $code);

        return strtoupper($clean ?? '');
    }

    public function parseRecoveryCodes(mixed $stored): array
    {
        if (is_array($stored)) {
            return array_values(array_map(fn ($c) => (string) $c, $stored));
        }

        if (is_string($stored)) {
            $json    = $this->decryptOrNull($stored) ?? $stored;
            $decoded = json_decode($json, true);
            if (is_array($decoded)) {
                return array_values(array_map(fn ($c) => (string) $c, $decoded));
            }
        }

        return [];
    }

    public function encryptRecoveryCodes(array $codes): string
    {
        return Crypt::encryptString(json_encode(array_values($codes)));
    }

    public function verifyEncryptedOrPlain(string $secretEncryptedOrPlain, string $code): bool
    {
        $secret = $this->decryptOrNull($secretEncryptedOrPlain) ?? $secretEncryptedOrPlain;

        return $this->verify($secret, $code);
    }

    private function decryptOrNull(?string $ciphertext): ?string
    {
        if ($ciphertext === null || $ciphertext === '') {
            return null;
        }

        try {
            return Crypt::decryptString($ciphertext);
        } catch (\Throwable $e) {
            try {
                return decrypt($ciphertext);
            } catch (\Throwable $e2) {
                return null;
            }
        }
    }
}
