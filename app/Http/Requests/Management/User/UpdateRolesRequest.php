<?php

namespace App\Http\Requests\Management\User;

use App\Enum\RoleName;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateRolesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $ids = $this->input('role_ids', []);
        if (!\is_array($ids)) {
            $ids = [];
        }

        $ids = array_values(array_unique(array_map('intval', $ids)));
        $this->merge(['role_ids' => $ids]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $target */
        $target = $this->route('user');
        $guard  = $target ? $target->getDefaultGuardName() : config('auth.defaults.guard');

        return [
            'role_ids'   => ['required', 'array', 'min:1'],
            'role_ids.*' => [
                'integer',
                Rule::exists('roles', 'id')->where(fn ($q) => $q->where('guard_name', $guard)),
            ],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            /** @var User|null $target */
            $target = $this->route('user');
            if (!$target) {
                return;
            }

            $actor = $this->user();

            if ($this->isNonSuperEditingSelf($actor, $target)) {
                $validator->errors()->add('roles', __('management/users.errors.self_edit_forbidden'));

                return;
            }

            if ($this->isNonSuperEditingASuper($actor, $target)) {
                $validator->errors()->add('roles', __('management/users.errors.cannot_edit_super'));

                return;
            }

            $ids = (array) $this->input('role_ids', []);

            $super = $this->superRoleForGuard($target->getDefaultGuardName());
            if (!$super) {
                return;
            }

            $currentlyHasSuper = $target->hasRole($super->name);
            $willHaveSuper     = in_array((int) $super->id, $ids, true);

            if ($currentlyHasSuper && !$willHaveSuper) {
                $totalSuperAdmins = User::role($super->name)->count();
                if ($totalSuperAdmins <= 1) {
                    $validator->errors()->add('roles', __('management/users.errors.cannot_remove_last_super'));
                }
            }
        });
    }

    /**
     * Helpers.
     */
    private function isNonSuperEditingSelf(?User $actor, ?User $target): bool
    {
        return $actor && $target && $actor->id === $target->id
            && !$actor->hasRole(RoleName::SUPER_ADMIN->value);
    }

    private function isNonSuperEditingASuper(?User $actor, ?User $target): bool
    {
        if (!$actor || !$target) {
            return false;
        }

        $super = $this->superRoleForGuard($target->getDefaultGuardName());
        if (!$super) {
            return false;
        }

        return $target->hasRole($super->name) && !$actor->hasRole($super->name);
    }

    private function superRoleForGuard(string $guard): ?Role
    {
        return Role::query()
            ->where('name', RoleName::SUPER_ADMIN->value)
            ->where('guard_name', $guard)
            ->first();
    }
}
