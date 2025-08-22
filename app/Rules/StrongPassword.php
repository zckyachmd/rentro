<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

class StrongPassword implements ValidationRule
{
    /**
     * Construct a new strong password rule.
     *
     * @param string|null $username The username to check against.
     * @param string|null $email The email to check against.
     * @param int $min The minimum length requirement.
     * @param bool $requireMixed Whether to require at least one uppercase and one lowercase letter.
     * @param bool $requireNumber Whether to require at least one number.
     * @param bool $requireSymbol Whether to require at least one symbol.
     */
    public function __construct(
        protected ?string $username = null,
        protected ?string $email = null,
        protected int $min = 6,
        protected bool $requireMixed = true,
        protected bool $requireNumber = true,
        protected bool $requireSymbol = true,
    ) {
    }

    /**
     * Run the validation rule.
     *
     * @param \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $pwd = (string) $value;

        if (mb_strlen($pwd) < $this->min) {
            $fail("Password minimal {$this->min} karakter.");

            return;
        }

        if ($this->requireMixed && (!preg_match('/[a-z]/u', $pwd) || !preg_match('/[A-Z]/u', $pwd))) {
            $fail('Password harus mengandung huruf besar dan huruf kecil.');
        }

        if ($this->requireNumber && !preg_match('/\\d/', $pwd)) {
            $fail('Password harus mengandung angka.');
        }

        if ($this->requireSymbol && !preg_match('/[^\\p{L}\\p{N}]/u', $pwd)) {
            $fail('Password harus mengandung simbol.');
        }

        $parts = [];
        if ($this->username) {
            $parts[] = $this->username;
        }
        if ($this->email && str_contains($this->email, '@')) {
            $parts[] = Str::before($this->email, '@');
        }

        foreach ($parts as $p) {
            $p = trim((string) $p);
            if ($p !== '' && Str::contains(Str::lower($pwd), Str::lower($p))) {
                $fail('Password tidak boleh mengandung username atau bagian dari email Anda.');
                break;
            }
        }
    }
}
