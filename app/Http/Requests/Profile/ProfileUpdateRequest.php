<?php

namespace App\Http\Requests\Profile;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Izinkan request ini (wajib true kalau tidak pakai policy).
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Rules validasi.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-zA-Z0-9_\.]+$/',
                Rule::unique(User::class, 'username')->ignore($this->user()->id),
            ],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class, 'email')->ignore($this->user()->id),
            ],
            'phone'                => ['required', 'string', 'max:255'],
            'dob'                  => ['nullable', 'date', 'before:today'],
            'gender'               => ['required', 'in:male,female,other'],
            'avatar'               => ['nullable', 'image', 'max:2048'],
            'address'              => ['required', 'array'],
            'address.label'        => ['nullable', 'string', 'max:255'],
            'address.address_line' => ['required', 'string', 'max:255'],
            'address.village'      => ['required', 'string', 'max:255'],
            'address.district'     => ['required', 'string', 'max:255'],
            'address.city'         => ['required', 'string', 'max:255'],
            'address.province'     => ['required', 'string', 'max:255'],
            'address.postal_code'  => ['required', 'string', 'max:20'],
        ];
    }
}
