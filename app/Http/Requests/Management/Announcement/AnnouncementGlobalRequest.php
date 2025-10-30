<?php

namespace App\Http\Requests\Management\Announcement;

use Illuminate\Foundation\Http\FormRequest;

class AnnouncementGlobalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'      => ['required', 'string', 'max:255'],
            'message'    => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'url', 'max:2048'],
            'persist'    => ['sometimes', 'boolean'],
        ];
    }
}
