<?php

namespace App\Http\Requests\Management\Announcement;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class AnnouncementStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target'       => ['required', 'string', 'in:global,role,user'],
            'role_id'      => ['nullable', 'integer', Rule::exists(Role::class, 'id')],
            'user_id'      => ['nullable', 'integer', Rule::exists(User::class, 'id')],
            'title'        => ['required', 'string', 'max:255'],
            'message'      => ['required', 'string', 'max:5000'],
            'action_url'   => ['nullable', 'url', 'max:2048'],
            'persist'      => ['sometimes', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->sometimes('role_id', ['required', 'integer', Rule::exists(Role::class, 'id')], function ($input) {
            return $input->target === 'role';
        });
        $validator->sometimes('user_id', ['required', 'integer', Rule::exists(User::class, 'id')], function ($input) {
            return $input->target === 'user';
        });
    }
}
