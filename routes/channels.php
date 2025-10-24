<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

// Default example channel retained for compatibility with packages/tools
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for personal notifications
// Channel: user.{id}
Broadcast::channel('user.{id}', function (User $user, int $id): bool {
    return (int) $user->id === (int) $id;
});

// Presence channel for role-based broadcasts
// Channel: role.{roleId}
Broadcast::channel('role.{roleId}', function (User $user, int $roleId) {
    try {
        $role = Role::query()->select(['id', 'name'])->find($roleId);
        if (!$role) {
            return false;
        }
        if (!$user->hasRole($role->name)) {
            return false;
        }

        // Presence payload (returned value is sent to others in the presence channel)
        return [
            'id'   => $user->id,
            'name' => $user->name,
        ];
    } catch (\Throwable $e) {
        Log::warning('Presence role channel auth failed', [
            'roleId' => $roleId,
            'userId' => $user->id ?? null,
            'error'  => $e->getMessage(),
        ]);

        return false;
    }
});

// Global announcement channel
// Public by default; can be toggled to private via config('notifications.global_private')
if (config('notifications.global_private', false)) {
    Broadcast::channel('global', function (User $user) {
        // Any authenticated user may join the private global channel
        return ['id' => $user->id, 'name' => $user->name];
    });
} else {
    // Public channel does not require authorization callback; return true to allow any connection
    Broadcast::channel('global', fn () => true);
}

// Private channel for management announcements (admin view realtime updates)
Broadcast::channel('management.announcements', function (User $user) {
    try {
        return $user->hasAnyRole([
            \App\Enum\RoleName::SUPER_ADMIN->value,
            \App\Enum\RoleName::OWNER->value,
            \App\Enum\RoleName::MANAGER->value,
        ]);
    } catch (\Throwable) {
        return false;
    }
});
