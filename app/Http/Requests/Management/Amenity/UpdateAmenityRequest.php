<?php

namespace App\Http\Requests\Management\Amenity;

use App\Enum\AmenityCategory;
use App\Enum\Locale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAmenityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $routeAmenity = $this->route('amenity');
        $id           = $routeAmenity ? $routeAmenity->id : null;

        return [
            'name' => [
                'nullable',
                'string',
                'max:100',
                $id ? Rule::unique('amenities', 'name')->ignore($id) : Rule::unique('amenities', 'name'),
            ],
            'names'    => ['required', 'array'],
            'names.*'  => ['nullable', 'string', 'max:100'],
            'icon'     => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z][A-Za-z0-9]*$/'],
            'category' => ['nullable', 'string', Rule::in(array_map(fn (AmenityCategory $c) => $c->value, AmenityCategory::cases()))],
        ];
    }

    protected function prepareForValidation(): void
    {
        $cat = (string) ($this->input('category') ?? '');
        $map = [
            'kamar'   => 'room',
            'komunal' => 'communal',
        ];
        if (isset($map[strtolower($cat)])) {
            $this->merge(['category' => $map[strtolower($cat)]]);
        }
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $names     = (array) $this->input('names', []);
            $supported = array_map(fn (Locale $c) => $c->value, Locale::cases());
            $hasAny    = false;
            foreach ($names as $k => $val) {
                if (is_string($val) && trim($val) !== '') {
                    $hasAny = true;
                    break;
                }
            }
            if (!$hasAny) {
                $v->errors()->add('names', __('validation.required'));
            }
            foreach (array_keys($names) as $k) {
                $kk = strtolower(explode('-', (string) $k)[0] ?? (string) $k);
                if (!in_array($kk, $supported, true)) {
                    $v->errors()->add('names.' . $k, __('validation.in'));
                }
            }
        });
    }
}
