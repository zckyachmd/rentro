<?php

namespace App\Http\Requests\Management\Room;

use Illuminate\Foundation\Http\FormRequest;

class BatchRoomPhotoRequest extends FormRequest
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
            'deleted_ids'   => ['nullable', 'array'],
            'deleted_ids.*' => ['integer'],
            'ordered_ids'   => ['nullable', 'array'],
            'ordered_ids.*' => ['integer'],
            'cover_id'      => ['nullable', 'integer'],
        ];
    }
}
