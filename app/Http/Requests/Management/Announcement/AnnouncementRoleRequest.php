<?php

namespace App\Http\Requests\Management\Announcement;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class AnnouncementRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role_id'    => ['required', 'integer', Rule::exists(Role::class, 'id')],
            'title'      => ['required', 'string', 'max:255'],
            'message'    => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'url', 'max:2048'],
            'persist'    => ['sometimes', 'boolean'],
        ];
    }
}
