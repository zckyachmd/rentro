<?php

namespace App\Http\Requests\Settings;

use App\Enum\Theme;
use Illuminate\Foundation\Http\FormRequest;

class UpdateThemePreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $theme = $this->input('theme');
        if (is_string($theme)) {
            $this->merge(['theme' => strtolower(trim($theme))]);
        }
    }

    public function rules(): array
    {
        return [
            'theme'    => ['required', 'string', 'in:light,dark,system'],
            'redirect' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'theme.required' => __('settings.preferences.theme.required'),
            'theme.in'       => __('settings.preferences.theme.in'),
        ];
    }

    /**
     * @return Theme
     */
    public function theme(): Theme
    {
        /** @var Theme $v */
        $v = Theme::from($this->validated('theme'));

        return $v;
    }
}
