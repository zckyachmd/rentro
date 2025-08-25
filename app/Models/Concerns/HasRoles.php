<?php

namespace App\Models\Concerns;

use App\Enum\CacheKey;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Traits\HasRoles as SpatieHasRoles;

/**
 * Extend Spatie HasRoles with audit logging for role assignments.
 */
trait HasRoles
{
    use SpatieHasRoles {
        assignRole as protected baseAssignRole;
        removeRole as protected baseRemoveRole;
        syncRoles as protected baseSyncRoles;
    }

    /**
     * Normalize a role name.
     *
     * This method takes a role that can be one of the following:
     * - A string representing the role name.
     * - An object with a `name` property.
     * - An array with a `name` key.
     *
     * The method will return the role name as a string.
     *
     * If the role name cannot be normalized, it will be encoded as a JSON string
     * instead.
     */
    protected function normalizeRoleName($role): string
    {
        if (is_string($role)) {
            return $role;
        }

        if (is_object($role) && property_exists($role, 'name')) {
            /** @var object{ name?: mixed } $role */
            $name = $role->name;

            return is_string($name) ? $name : (is_scalar($name) ? (string) $name : 'unknown');
        }

        if (is_array($role) && array_key_exists('name', $role)) {
            $name = $role['name'];

            return is_string($name) ? $name : (is_scalar($name) ? (string) $name : 'unknown');
        }

        $json = json_encode($role, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json !== false) {
            return $json;
        }

        return is_scalar($role) ? (string) $role : 'unknown';
    }

    /**
     * Ensure guard name is available when wrapping Spatie's HasRoles.
     */
    public function getDefaultGuardName(): string
    {
        return $this->guard_name ?? config('auth.defaults.guard');
    }

    /**
     * Assign role(s) then log activity.
     * @param mixed ...$roles
     */
    public function assignRole(...$roles): static
    {
        $result = $this->baseAssignRole(...$roles);

        if (function_exists('activity') && Auth::check()) {
            activity('acl')
                ->causedBy(Auth::user())
                ->performedOn($this)
                ->withProperties([
                    'action' => 'assign_role',
                    'roles'  => array_map(fn ($r) => $this->normalizeRoleName($r), $roles),
                ])->log('Assign role to user');
        }

        $this->clearMenuCache();

        return $result;
    }

    /**
     * Remove a role then log activity.
     * @param mixed $role
     */
    public function removeRole($role): static
    {
        $result = $this->baseRemoveRole($role);

        if (function_exists('activity') && Auth::check()) {
            activity('acl')
                ->causedBy(Auth::user())
                ->performedOn($this)
                ->withProperties([
                    'action' => 'remove_role',
                    'role'   => $this->normalizeRoleName($role),
                ])->log('Remove role from user');
        }

        $this->clearMenuCache();

        return $result;
    }

    /**
     * Sync roles (replace all) then log activity.
     * @param mixed ...$roles
     */
    public function syncRoles(...$roles): static
    {
        $flat = count($roles) === 1 && is_array($roles[0]) ? $roles[0] : $roles;

        $result = $this->baseSyncRoles($flat);

        if (function_exists('activity') && Auth::check()) {
            activity('acl')
                ->causedBy(Auth::user())
                ->performedOn($this)
                ->withProperties([
                    'action' => 'sync_user_roles',
                    'roles'  => array_map(fn ($r) => $this->normalizeRoleName($r), $flat),
                ])->log('Sync user roles');
        }

        $this->clearMenuCache();

        return $result;
    }

    /**
     * Clear cached menu for this user when roles change.
     */
    protected function clearMenuCache(): void
    {
        if ($this->exists) {
            Cache::forget(CacheKey::MenuForUser->forUser($this->id));
        }
    }
}
