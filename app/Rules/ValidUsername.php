<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidUsername implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/^[a-zA-Z0-9_-]{6,30}$/', $value)) {
            $fail('Username harus terdiri dari 6 sampai 30 karakter, hanya boleh huruf, angka, strip, dan underscore.');
        }
    }
}
