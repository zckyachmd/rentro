<?php

namespace App\Http\Requests\Profile;

use App\Models\AppSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $contactId = optional($this->route('contact'))->id;

        return [
            'name'  => ['required', 'string', 'max:255'],
            'phone' => [
                'required', 'string', 'max:20',
                Rule::unique('emergency_contacts', 'phone')
                    ->ignore($contactId)
                    ->where(fn ($q) => $q->where('user_id', $this->user()->id)),
            ],
            'relationship' => ['required', 'string', 'max:50'],
            'email'        => [
                'nullable', 'email', 'max:255',
                Rule::unique('emergency_contacts', 'email')
                    ->ignore($contactId)
                    ->where(fn ($q) => $q->where('user_id', $this->user()->id)),
            ],
            'address_line' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        if ($this->isMethod('post')) {
            $validator->after(function ($v) {
                $max = (int) AppSetting::config('profile.emergency_contacts_max', 3);
                if ($this->user()->emergencyContacts()->count() >= $max) {
                    $v->errors()->add('name', 'Maksimal ' . $max . ' kontak darurat.');
                }
            });
        }
    }
}
