<?php

namespace App\Http\Controllers\Management;

use App\Enum\CacheKey;
use App\Enum\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Role\StoreRoleRequest;
use App\Http\Requests\Management\Role\UpdateRolePermissionsRequest;
use App\Http\Requests\Management\Role\UpdateRoleRequest;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function index(Request $request)
    {
        $query = Role::query()
            ->select(['id', 'name', 'guard_name', 'created_at'])
            ->withCount(['users', 'permissions']);

        $options = [
            'with'         => ['permissions:id'],
            'search_param' => 'search',
            'searchable'   => ['name', 'guard_name'],
            'sortable'     => [
                'name'        => 'name',
                'users'       => fn ($q, string $dir) => $q->orderBy('users_count', $dir),
                'permissions' => fn ($q, string $dir) => $q->orderBy('permissions_count', $dir),
            ],
            'default_sort' => ['name', 'asc'],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\Spatie\Permission\Models\Role> $page */
        $page = $this->applyTable($query, $request, $options);

        /** @var \Illuminate\Database\Eloquent\Collection<int, \Spatie\Permission\Models\Role> $collection */
        $collection = $page->getCollection();

        $mapped = $collection->map(function (Role $r): array {
            return [
                'id'                => $r->id,
                'name'              => $r->name,
                'guard_name'        => $r->guard_name,
                'users_count'       => (int) ($r->users_count ?? 0),
                'permissions_count' => (int) ($r->permissions_count ?? 0),
                'permission_ids'    => $r->permissions->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
                'created_at'        => optional($r->created_at)->toISOString(),
            ];
        });

        $page->setCollection($mapped);

        $rolesPayload = $this->tablePaginate($page);

        $permissions = Cache::remember(
            CacheKey::AllPermissions->value,
            now()->addDay(),
            fn () => Permission::query()->orderBy('name')->get(),
        );

        return Inertia::render('management/roles/index', [
            'roles'       => $rolesPayload,
            'permissions' => $permissions,
            'query'       => [
                'page'     => $rolesPayload['current_page'],
                'per_page' => $rolesPayload['per_page'],
                'sort'     => $request->query('sort'),
                'dir'      => $request->query('dir'),
                'search'   => $request->query('search'),
                'guard'    => $request->query('guard'),
            ],
        ]);
    }

    /**
     * Update permissions assigned to the given role.
     */
    public function updatePermissions(UpdateRolePermissionsRequest $request, Role $role): RedirectResponse
    {
        $data = $request->validated();
        $ids  = collect($data['permission_ids'] ?? [])->unique()->values()->all();

        $perms = Permission::query()
            ->whereIn('id', $ids)
            ->where('guard_name', $role->guard_name)
            ->get();

        $role->syncPermissions($perms);

        /** @var \Spatie\Permission\Models\Role $subject */
        $subject = $role;
        $this->logEvent(
            event: 'role_permissions_updated',
            causer: $request->user(),
            subject: $subject,
            properties: [
                'permission_ids' => $perms->pluck('id')->values()->all(),
                'count'          => $perms->count(),
            ],
        );

        return back()->with('success', 'Permissions role berhasil diperbarui.');
    }

    /**
     * Store a newly created role.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        // validated by Form Request
        $data = $request->validated();

        // unique name per guard
        $exists = Role::query()
            ->where('name', $data['name'])
            ->where('guard_name', $data['guard_name'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'Nama role sudah dipakai pada guard yang sama.')->withInput();
        }

        $role = Role::create($data);

        /** @var \Spatie\Permission\Models\Role $subject */
        $subject = $role;
        $this->logEvent(
            event: 'role_created',
            causer: $request->user(),
            subject: $subject,
            properties: [
                'name'       => $role->name,
                'guard_name' => $role->guard_name,
            ],
        );

        return back()->with('success', 'Role berhasil dibuat.');
    }

    /**
     * Update the specified role.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $data = $request->validated();

        $isSuperAdmin = strcasecmp($role->name, RoleName::SUPER_ADMIN->value) === 0;

        if ($isSuperAdmin && ($role->name !== $data['name'] || $role->guard_name !== $data['guard_name'])) {
            return back()->with('error', 'Role super-admin tidak boleh diubah.');
        }

        $original = $role->only(['name', 'guard_name']);
        $role->update($data);

        $changes = [
            'before' => $original,
            'after'  => $role->only(['name', 'guard_name']),
        ];

        /** @var \Spatie\Permission\Models\Role $subject */
        $subject = $role;
        $this->logEvent(
            event: 'role_updated',
            causer: $request->user(),
            subject: $subject,
            properties: $changes,
        );

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role): RedirectResponse
    {
        if (strcasecmp($role->name, RoleName::SUPER_ADMIN->value) === 0) {
            return back()->with('error', 'Role super-admin tidak boleh dihapus.');
        }

        $assignedCount = $role->users()->count();
        if ($assignedCount > 0) {
            return back()->with('error', "Role tidak bisa dihapus karena masih terkait dengan {$assignedCount} pengguna. Ganti role pengguna tersebut terlebih dahulu.");
        }

        $snapshot = $role->only(['id', 'name', 'guard_name']);
        /** @var \Spatie\Permission\Models\Role $subject */
        $subject = $role;
        $role->delete();

        $this->logEvent(
            event: 'role_deleted',
            causer: request()->user(),
            subject: $subject,
            properties: $snapshot,
        );

        return back()->with('success', 'Role berhasil dihapus.');
    }
}
