<?php

namespace App\Http\Requests\Profile;

use App\Enum\DocumentStatus;
use App\Enum\DocumentType;
use App\Enum\Gender;
use App\Models\AppSetting;
use App\Models\User;
use App\Rules\MinAge;
use App\Rules\ValidUsername;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Izinkan request ini (wajib true kalau tidak pakai policy).
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Rules validasi.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        $minAge = (int) AppSetting::config('profile.min_age_years', 17);

        return [
            'name'     => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                new ValidUsername(),
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
            'phone'  => ['required', 'string', 'max:20'],
            'dob'    => ['nullable', 'date', 'before:today', new MinAge($minAge)],
            'gender' => ['required', Rule::in(Gender::values())],
            'avatar' => ['nullable', 'image', 'max:2048'],

            // Address
            'address'              => ['sometimes', 'array'],
            'address.label'        => ['nullable', 'string', 'max:50'],
            'address.address_line' => ['required_with:address', 'string', 'max:1000'],
            'address.village'      => ['required_with:address', 'string', 'max:100'],
            'address.district'     => ['required_with:address', 'string', 'max:100'],
            'address.city'         => ['required_with:address', 'string', 'max:100'],
            'address.province'     => ['required_with:address', 'string', 'max:100'],
            'address.postal_code'  => ['required_with:address', 'string', 'regex:/^\d{5}$/'],

            // Document
            'document'        => ['sometimes', 'array'],
            'document.type'   => ['required_with:document', Rule::in(DocumentType::values())],
            'document.number' => ['required_with:document', 'string', 'max:255'],
            'document.file'   => [
                Rule::requiredIf(function () use ($user) {
                    $current    = $user->document;
                    $isRejected = $current && (string) $current->status === (string) (DocumentStatus::REJECTED->value);

                    return $this->has('document') && $isRejected;
                }),
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:2048',
            ],
            'document.issued_at'  => ['required_with:document', 'date', 'before_or_equal:today'],
            'document.expires_at' => ['nullable', 'date', 'after:today'],
        ];
    }

    /**
     * Normalize payload: if address/document groups are present but empty, drop them
     * so group validation and processing can be skipped gracefully.
     */
    protected function prepareForValidation(): void
    {
        $addr = $this->input('address');
        if (is_array($addr)) {
            $keys   = ['label', 'address_line', 'village', 'district', 'city', 'province', 'postal_code'];
            $hasAny = false;
            foreach ($keys as $k) {
                $v = $addr[$k] ?? null;
                if (is_string($v)) {
                    $v = trim($v);
                }
                if (!empty($v)) {
                    $hasAny = true;
                    break;
                }
            }
            if (!$hasAny) {
                $this->request->remove('address');
            }
        }

        $doc     = $this->input('document');
        $docFile = $this->file('document.file');
        if (is_array($doc) || $docFile) {
            $keys   = ['type', 'number', 'issued_at', 'expires_at'];
            $hasAny = false;
            foreach ($keys as $k) {
                $v = is_array($doc) ? ($doc[$k] ?? null) : null;
                if (is_string($v)) {
                    $v = trim($v);
                }
                if (!empty($v)) {
                    $hasAny = true;
                    break;
                }
            }
            if ($docFile) {
                $hasAny = true;
            }
            if (!$hasAny) {
                $this->request->remove('document');
            }
        }
    }
}
