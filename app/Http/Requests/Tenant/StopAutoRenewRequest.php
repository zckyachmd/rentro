<?php

namespace App\Http\Requests\Tenant;

use App\Models\Contract;
use Illuminate\Foundation\Http\FormRequest;

class StopAutoRenewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        /** @var \App\Models\Contract|null $contract */
        $contract = $this->route('contract');

        return $user !== null
            && $contract instanceof Contract
            && (string) $contract->user_id === (string) $user->id;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('confirm')) {
            $val = $this->input('confirm');
            if (is_string($val)) {
                $this->merge(['confirm' => trim($val)]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'confirm' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'confirm.accepted' => __('tenant/contract.validation.confirm.accepted'),
        ];
    }
}
