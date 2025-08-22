<?php

namespace App\Services\Contracts;

interface TwoFactorServiceInterface
{
    /** Generate new TOTP secret */
    public function generateSecret(int $length = 32): string;

    /** Build otpauth:// URL */
    public function getOtpAuthUrl(string $issuer, string $accountName, string $secret): string;

    /** Render QR code (SVG) dari otpauth URL. */
    public function makeQrSvg(string $otpauthUrl, ?int $size = null): string;

    /** Verifikasi kode OTP (6 digit default). */
    public function verify(string $secret, string $code): bool;

    /** @return array<int,string> Daftar recovery codes */
    public function generateRecoveryCodes(int $count = 8): array;

    /** Utility: bentuk QR SVG langsung dari bagian penyusun tanpa memanggil 2 method terpisah. */
    public function makeQrSvgFromParts(string $accountName, string $secret, ?string $issuer = null, ?int $size = null): string;

    /** Normalisasi recovery code untuk perbandingan (uppercase, strip non A–Z0–9-). */
    public function normalizeRecoveryCode(string $code): string;

    /** Parse kolom recovery codes dari berbagai format (encrypted JSON / plaintext JSON / array). */
    public function parseRecoveryCodes(mixed $stored): array;

    /** Enkripsi & serialize recovery codes ke string penyimpanan. */
    public function encryptRecoveryCodes(array $codes): string;

    /** Verifikasi TOTP dengan secret yang mungkin terenkripsi atau plaintext. */
    public function verifyEncryptedOrPlain(string $secretEncryptedOrPlain, string $code): bool;
}
