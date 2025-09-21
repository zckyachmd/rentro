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
class StoreRoomRequest extends FormRequest
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
            'room_type_id' => ['required', 'exists:room_types,id'],
            'number'       => [
                'required',
                'string',
                'max:100',
                Rule::unique('rooms', 'number')
                    ->where(fn ($q) => $q->where('building_id', $this->input('building_id'))),
            ],
            'name'   => ['nullable', 'string', 'max:150'],
            'status' => [
                'required',
                Rule::enum(RoomStatus::class),
            ],
            'max_occupancy'         => ['required', 'integer', 'min:1', 'max:255'],
            'price_rupiah'          => ['nullable', 'numeric', 'min:0'],
            'price_weekly_rupiah'   => ['nullable', 'numeric', 'min:0'],
            'price_daily_rupiah'    => ['nullable', 'numeric', 'min:0'],
            'deposit_rupiah'        => ['nullable', 'numeric', 'min:0'],
            'deposit_weekly_rupiah' => ['nullable', 'numeric', 'min:0'],
            'deposit_daily_rupiah'  => ['nullable', 'numeric', 'min:0'],
            'size_m2'               => ['nullable', 'numeric', 'min:0'],
            'notes'                 => ['nullable', 'string'],
            'amenities'             => ['required', 'array'],
            'amenities.*'           => ['integer', 'distinct', 'exists:amenities,id'],
            'gender_policy'         => ['required', 'in:any,male,female'],
            'photos'                => ['required', 'array'],
            'photos.*'              => ['file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:10240'],
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'building_id'           => $this->toNullableInt($this->input('building_id')),
            'floor_id'              => $this->toNullableInt($this->input('floor_id')),
            'room_type_id'          => $this->input('room_type_id'),
            'max_occupancy'         => $this->toNullableInt($this->input('max_occupancy')),
            'price_rupiah'          => $this->toNullableFloat($this->input('price_rupiah')),
            'price_weekly_rupiah'   => $this->toNullableFloat($this->input('price_weekly_rupiah')),
            'price_daily_rupiah'    => $this->toNullableFloat($this->input('price_daily_rupiah')),
            'deposit_rupiah'        => $this->toNullableFloat($this->input('deposit_rupiah')),
            'deposit_weekly_rupiah' => $this->toNullableFloat($this->input('deposit_weekly_rupiah')),
            'deposit_daily_rupiah'  => $this->toNullableFloat($this->input('deposit_daily_rupiah')),
            'size_m2'               => $this->toNullableFloat($this->input('size_m2')),
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
