<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Reason implements ValidationRule
{
    public function __construct(
        private int $min = 3,
        private int $max = 500,
    ) {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            // Let 'required' or 'nullable' handle emptiness
            return;
        }

        if (!is_string($value)) {
            $fail('Kolom :attribute harus berupa teks.');

            return;
        }

        $len = mb_strlen(trim($value));
        if ($this->min > 0 && $len < $this->min) {
            $fail('Kolom :attribute minimal ' . $this->min . ' karakter.');
        }
        if ($this->max > 0 && $len > $this->max) {
            $fail('Kolom :attribute maksimal ' . $this->max . ' karakter.');
        }
    }
}
