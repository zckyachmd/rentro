<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class EmergencyContactRequest extends FormRequest
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
            'name'         => ['required', 'string', 'max:255'],
            'phone'        => ['required', 'string', 'max:255'],
            'relationship' => ['required', 'string', 'max:255'],
            'email'        => ['nullable', 'email', 'max:255'],
            'address_line' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        if ($this->isMethod('post')) {
            $validator->after(function ($v) {
                if ($this->user()->emergencyContacts()->count() >= 3) {
                    $v->errors()->add('name', 'Maksimal 3 kontak darurat.');
                }
            });
        }
    }
}
