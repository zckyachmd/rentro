<?php

namespace App\Http\Requests\Management\User;

use App\Enum\RoleName;
use App\Rules\Reason;
use Illuminate\Foundation\Http\FormRequest;

class TwoFactorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mode' => [
                'required',
                'in:disable,recovery_show,recovery_regenerate',
            ],
            'reason' => ['nullable', new Reason(20)],
        ];
    }

    public function withValidator($validator)
    {
        $actor  = $this->user();
        $target = $this->route('user');

        if ($actor && $target && $target->hasRole(RoleName::SUPER_ADMIN->value) && !$actor->hasRole(RoleName::SUPER_ADMIN->value)) {
            $validator->errors()->add('mode', 'Anda tidak memiliki izin untuk mengelola Two Factor pengguna dengan peran Super Admin.');
        }

        $validator->after(function ($v) use ($target) {
            $mode   = (string) $this->input('mode');
            $reason = (string) ($this->input('reason') ?? '');

            $needsReason = true;

            if ($target) {
                try {
                    $codes = app(\App\Services\TwoFactorService::class)
                        ->parseRecoveryCodes($target->two_factor_recovery_codes);
                } catch (\Throwable $e) {
                    $codes = [];
                }
                if (empty($codes) && in_array($mode, ['recovery_show', 'recovery_regenerate'], true)) {
                    $needsReason = false;
                }
            }

            if ($needsReason) {
                if (mb_strlen(trim($reason)) < 20) {
                    $v->errors()->add('reason', 'Alasan minimal 20 karakter.');
                }
            }
        });
    }
}
