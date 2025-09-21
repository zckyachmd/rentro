<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Lang;

class MinAge implements ValidationRule, DataAwareRule
{
    protected int $minYears;
    protected array $data = [];

    public function __construct(int $minYears = 17)
    {
        $this->minYears = max(0, $minYears);
    }

    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }
        try {
            $dob = Carbon::parse((string) $value)->startOfDay();
        } catch (\Throwable) {
            return;
        }
        $today = Carbon::now()->startOfDay();
        $age   = $dob->diffInYears($today, false);
        if ($age < $this->minYears) {
            $message = Lang::has('validation.custom.dob.min_age')
                ? __('validation.custom.dob.min_age', ['min' => $this->minYears])
                : __('Usia minimal :min tahun.', ['min' => $this->minYears]);
            $fail($message);
        }
    }
}
