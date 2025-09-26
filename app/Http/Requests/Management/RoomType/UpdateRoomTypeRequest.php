<?php

namespace App\Http\Requests\Management\RoomType;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @mixin \Illuminate\Http\Request
 * @method mixed input(string $key = null, mixed $default = null)
 * @method void merge(array $input)
 */
class UpdateRoomTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $route = $this->route('room_type');
        $id    = is_object($route) ? $route->id : $route;

        return [
            'name'                  => ['required', 'string', 'max:150', Rule::unique('room_types', 'name')->ignore($id)],
            'slug'                  => ['nullable', 'string', 'max:150', Rule::unique('room_types', 'slug')->ignore($id)],
            'capacity'              => ['required', 'integer', 'min:1', 'max:65535'],
            'price_rupiah'          => ['nullable', 'numeric', 'min:0'],
            'price_weekly_rupiah'   => ['nullable', 'numeric', 'min:0'],
            'price_daily_rupiah'    => ['nullable', 'numeric', 'min:0'],
            'deposit_rupiah'        => ['nullable', 'numeric', 'min:0'],
            'deposit_weekly_rupiah' => ['nullable', 'numeric', 'min:0'],
            'deposit_daily_rupiah'  => ['nullable', 'numeric', 'min:0'],
            'description'           => ['nullable', 'string'],
            'is_active'             => ['nullable', 'boolean'],
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'capacity'              => $this->toNullableInt($this->input('capacity')),
            'price_rupiah'          => $this->toNullableFloat($this->input('price_rupiah')),
            'price_weekly_rupiah'   => $this->toNullableFloat($this->input('price_weekly_rupiah')),
            'price_daily_rupiah'    => $this->toNullableFloat($this->input('price_daily_rupiah')),
            'deposit_rupiah'        => $this->toNullableFloat($this->input('deposit_rupiah')),
            'deposit_weekly_rupiah' => $this->toNullableFloat($this->input('deposit_weekly_rupiah')),
            'deposit_daily_rupiah'  => $this->toNullableFloat($this->input('deposit_daily_rupiah')),
            'is_active'             => $this->toNullableBool($this->input('is_active')),
        ]);
    }

    private function toNullableInt(mixed $v): ?int
    {
        if ($v === null || $v === '' || $v === 'null') {
            return null;
        }

        return (int) $v;
    }

    private function toNullableFloat(mixed $v): ?float
    {
        if ($v === null || $v === '' || $v === 'null') {
            return null;
        }
        if (is_string($v)) {
            $v = str_replace(['.', ','], ['', '.'], $v);
        }

        return (float) $v;
    }

    private function toNullableBool(mixed $v): ?bool
    {
        if ($v === null || $v === '' || $v === 'null') {
            return null;
        }

        return filter_var($v, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? null;
    }
}
