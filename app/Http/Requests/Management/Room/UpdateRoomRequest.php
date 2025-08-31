<?php

namespace App\Http\Requests\Management\Room;

use App\Enum\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @mixin \Illuminate\Http\Request
 * @method mixed input(string $key = null, mixed $default = null)
 * @method void merge(array $input)
 */
class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'building_id'  => ['required', 'integer', 'exists:buildings,id'],
            'floor_id'     => ['required', 'integer', 'exists:floors,id'],
            'room_type_id' => ['required', 'integer', 'exists:room_types,id'],
            'number'       => ['required', 'string', 'max:100'],
            'name'         => ['nullable', 'string', 'max:150'],
            'status'       => [
                'required',
                Rule::enum(RoomStatus::class),
            ],
            'max_occupancy'  => ['required', 'integer', 'min:1', 'max:255'],
            'price_rupiah'   => ['nullable', 'numeric', 'min:0'],
            'notes'          => ['nullable', 'string'],
            'amenities'      => ['required', 'array'],
            'amenities.*'    => ['integer', 'distinct', 'exists:amenities,id'],
            'gender_policy'  => ['required', 'in:any,male,female'],
            'billing_period' => ['required', 'in:monthly,weekly,daily'],
            'photos'         => ['required', 'array'],
            'photos.*'       => ['file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:10240'],
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'building_id'   => $this->toNullableInt($this->input('building_id')),
            'floor_id'      => $this->toNullableInt($this->input('floor_id')),
            'room_type_id'  => $this->toNullableInt($this->input('room_type_id')),
            'max_occupancy' => $this->toNullableInt($this->input('max_occupancy')),
            'price_rupiah'  => $this->toNullableFloat($this->input('price_rupiah')),
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
}
