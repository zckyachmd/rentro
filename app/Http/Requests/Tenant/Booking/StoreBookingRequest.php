<?php

namespace App\Http\Requests\Tenant\Booking;

use App\Enum\BillingPeriod;
use App\Enum\BookingStatus;
use App\Enum\RoomStatus;
use App\Models\AppSetting;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // Snowflake ID: kirim sebagai string numerik untuk hindari presisi JS
            'room_id' => [
                'required',
                'string',
                'regex:/^\d+$/',
                Rule::exists('rooms', 'id')
                    ->whereNull('deleted_at')
                    ->where(fn ($q) => $q->where('status', RoomStatus::VACANT->value)),
            ],
            'start_date'     => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'duration_count' => ['required', 'integer', 'min:1', 'max:24'],
            'billing_period' => ['required', 'in:' . implode(',', array_map(fn ($c) => $c->value, BillingPeriod::cases()))],
            'promo_code'     => ['nullable', 'string', 'max:64'],
            'notes'          => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'room_id.regex'  => __('tenant/booking.room_invalid'),
            'room_id.exists' => __('tenant/booking.room_not_available'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($v->errors()->any()) {
                return;
            }

            $user = $this->user();
            if (!$user) {
                return;
            }

            $roomId        = (string) $this->input('room_id');
            $now           = Carbon::now();
            $softHoldHours = (int) AppSetting::config('booking.soft_hold_hours', 48);
            $softHoldHours = max(0, $softHoldHours);
            $holdFrom      = $now->copy()->subHours($softHoldHours);

            // 1) Limit: max 3 active (requested) bookings per user
            $maxActive   = (int) AppSetting::config('booking.max_active_requests', 3);
            $maxActive   = max(0, $maxActive);
            $activeCount = Booking::query()
                ->where('user_id', $user->id)
                ->where('status', BookingStatus::REQUESTED->value)
                ->count();
            if ($maxActive > 0 && $activeCount >= $maxActive) {
                $v->errors()->add('room_id', __('tenant/booking.too_many_active'));

                return;
            }

            // 2) Prevent duplicate request for the same room by same user
            $dup = Booking::query()
                ->where('user_id', $user->id)
                ->where('room_id', $roomId)
                ->where('status', BookingStatus::REQUESTED->value)
                ->exists();
            if ($dup) {
                $v->errors()->add('room_id', __('tenant/booking.already_requested'));

                return;
            }

            // 3) Soft hold: if another tenant has requested this room in the last 48 hours
            $heldByOther = Booking::query()
                ->where('room_id', $roomId)
                ->where('status', BookingStatus::REQUESTED->value)
                ->where('user_id', '!=', $user->id)
                ->where('created_at', '>=', $holdFrom)
                ->exists();
            if ($heldByOther) {
                $v->errors()->add('room_id', __('tenant/booking.room_on_hold'));
            }
        });
    }

    public function prepareForValidation(): void
    {
        $bp = (string) ($this->input('billing_period') ?? 'monthly');
        if ($bp === '') {
            $this->merge(['billing_period' => BillingPeriod::MONTHLY->value]);
        }
    }
}
