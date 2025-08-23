<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\Auth;
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
                    'roles'  => array_map(fn ($r) => is_string($r) ? $r : (is_object($r) && property_exists($r, 'name') ? $r->name : (string) $r), $roles),
                ])->log('Assign role to user');
        }

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
                    'role'   => is_string($role) ? $role : (is_object($role) && property_exists($role, 'name') ? $role->name : (string) $role),
                ])->log('Remove role from user');
        }

        return $result;
    }

    /**
     * Sync roles (replace all) then log activity.
     * @param mixed ...$roles
     */
    public function syncRoles(...$roles): static
    {
        // Support passing a single array arg or variadic values
        $flat = count($roles) === 1 && is_array($roles[0]) ? $roles[0] : $roles;

        $result = $this->baseSyncRoles($flat);

        if (function_exists('activity') && Auth::check()) {
            activity('acl')
                ->causedBy(Auth::user())
                ->performedOn($this)
                ->withProperties([
                    'action' => 'sync_user_roles',
                    'roles'  => array_map(fn ($r) => is_string($r) ? $r : (is_object($r) && property_exists($r, 'name') ? $r->name : (string) $r), $flat),
                ])->log('Sync user roles');
        }

        return $result;
    }
}
