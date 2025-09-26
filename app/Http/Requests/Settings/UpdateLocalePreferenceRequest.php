<?php

namespace App\Http\Requests\Settings;

use App\Enum\Locale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLocalePreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $locale = $this->input('locale');
        if (is_string($locale)) {
            $this->merge(['locale' => strtolower(trim($locale))]);
        }
    }

    public function rules(): array
    {
        $supported = array_map(fn (Locale $c) => $c->value, Locale::cases());

        return [
            'locale'   => ['required', 'string', Rule::in($supported)],
            'redirect' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'locale.required' => __('settings.preferences.locale.required'),
            'locale.in'       => __('settings.preferences.locale.in'),
        ];
    }

    public function locale(): Locale
    {
        /** @var Locale $v */
        $v = Locale::from($this->validated('locale'));

        return $v;
    }
}
