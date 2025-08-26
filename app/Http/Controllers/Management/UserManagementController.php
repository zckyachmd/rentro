<?php

namespace App\Http\Controllers\Management;

use App\Enum\CacheKey;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\User\CreateUserRequest;
use App\Http\Requests\Management\User\ForceLogoutRequest;
use App\Http\Requests\Management\User\ResetPasswordRequest;
use App\Http\Requests\Management\User\TwoFactorRequest;
use App\Http\Requests\Management\User\UpdateRolesRequest;
use App\Models\Session;
use App\Models\User;
use App\Notifications\UserInvited;
use App\Services\TwoFactorService;
use App\Traits\DataTable;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    use DataTable;

    public function __construct(private TwoFactorService $twofa)
    {
    }

    public function index(Request $request)
    {
        $query = User::query()
            ->select(['id', 'name', 'email', 'phone', 'two_factor_secret', 'two_factor_confirmed_at', 'avatar_path'])
            ->with(['roles:id,name', 'latestSession']);

        $options = [
            'search_param' => 'search',
            'searchable'   => ['name', 'email', 'phone'],
            'sortable'     => [
                'name'               => 'name',
                'email'              => 'email',
                'phone'              => 'phone',
                'two_factor_enabled' => function ($q, string $dir) {
                    $q->orderByRaw('CASE WHEN two_factor_secret IS NULL THEN 0 ELSE 1 END ' . ($dir === 'desc' ? 'DESC' : 'ASC'));
                },
            ],
            'default_sort' => ['name', 'asc'],
            'filters'      => [
                'role_id' => function ($q, $roleId) {
                    $q->whereHas('roles', fn ($r) => $r->where('id', $roleId));
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\App\Models\User> $page */
        $page = $this->applyTable($query, $request, $options);

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $collection */
        $collection = $page->getCollection();

        $mapped = $collection->map(function (User $u): array {
            $last = null;
            /** @var \App\Models\Session|null $sess */
            $sess = $u->latestSession;
            if ($sess?->last_activity) {
                $ts   = (int) $sess->last_activity;
                $last = Carbon::createFromTimestamp($ts, config('app.timezone'))->diffForHumans();
            }

            /** @var \Illuminate\Support\Collection<int, \Spatie\Permission\Models\Role> $roles */
            $roles = $u->roles;

            return [
                'id'                 => $u->id,
                'name'               => $u->name,
                'email'              => $u->email,
                'avatar'             => $u->avatar_url ?? null,
                'phone'              => $u->phone ?? null,
                'roles'              => $roles->map(fn (Role $r) => ['id' => $r->id, 'name' => $r->name])->values()->all(),
                'two_factor_enabled' => !empty($u->two_factor_secret) && !empty($u->two_factor_confirmed_at),
                'last_active_at'     => $last,
            ];
        });

        $page->setCollection($mapped);

        $usersPayload = $this->tablePaginate($page);

        $roles = Cache::remember(
            CacheKey::AllRoles->value,
            now()->addDay(),
            fn () => Role::orderBy('name')->get(['id', 'name'])
                ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->all(),
        );

        return Inertia::render('management/users/index', [
            'users' => $usersPayload,
            'roles' => $roles,
            'query' => [
                'page'    => $usersPayload['current_page'],
                'perPage' => $usersPayload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
                'roleId'  => $request->query('role_id'),
            ],
        ]);
    }

    public function createUser(CreateUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $tempPassword = Str::random(12);

        $attrs = [
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'phone'    => $validated['phone'] ?? null,
            'password' => bcrypt($tempPassword),
            'username' => User::generateUniqueUsername($validated['name']),
        ];

        $attrs['force_password_change'] = (bool) ($validated['force_password_change'] ?? true);

        /** @var \App\Models\User $user */
        $user = User::create($attrs);

        // Assign roles
        $guard = $user->getDefaultGuardName();
        $roles = Role::query()
            ->whereIn('id', $validated['roles'])
            ->where('guard_name', $guard)
            ->get();
        $user->syncRoles($roles);

        /** @var \Illuminate\Auth\Passwords\PasswordBroker $broker */
        $broker   = Password::broker();
        $token    = $broker->createToken($user);
        $resetUrl = route('password.reset', ['token' => $token, 'email' => $user->email]);

        try {
            $user->notify(new UserInvited($user->username, $tempPassword, $resetUrl));
        } catch (\Throwable $e) {
            // ignore
        }

        $sendVerification = (bool) ($validated['send_verification'] ?? true);
        if ($sendVerification && !$user->hasVerifiedEmail()) {
            try {
                $user->sendEmailVerificationNotification();
            } catch (\Throwable $e) {
                // ignore
            }
        }

        activity('system')
            ->causedBy($request->user())
            ->performedOn($user)
            ->withProperties([
                'roles'      => $roles->pluck('name')->values()->all(),
                'invited_by' => $request->user()?->id,
                'invited_at' => now(),
            ])->log('invited_user');

        return back()->with('success', 'Pengguna berhasil dibuat. Username & password sementara dikirim ke email beserta tautan ubah password.');
    }

    public function updateRoles(UpdateRolesRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $ids = $validated['role_ids'] ?? [];

        $guard = $user->getDefaultGuardName();

        $roles = Role::query()
            ->whereIn('id', $ids)
            ->where('guard_name', $guard)
            ->get();

        $currentIds = $user->roles()->pluck('id')->all();
        sort($currentIds);
        $targetIds = $roles->pluck('id')->all();
        sort($targetIds);

        if ($currentIds === $targetIds) {
            return back()->with('success', 'Tidak ada perubahan peran.');
        }

        $user->syncRoles($roles);

        return back()->with('success', 'Peran pengguna berhasil diperbarui.');
    }

    public function resetPasswordLink(ResetPasswordRequest $request, User $user): JsonResponse
    {
        if (!$user->email) {
            return response()->json([
                'error' => 'Pengguna tidak memiliki email.',
            ], 400);
        }

        $validated = $request->validated();
        /** @var \Illuminate\Auth\Passwords\PasswordBroker $broker */
        $broker = Password::broker();

        $mode = $validated['mode'] ?? 'send';

        return match ($mode) {
            'generate' => (function () use ($broker, $user) {
                $token    = $broker->createToken($user);
                $resetUrl = route('password.reset', [
                    'token' => $token,
                    'email' => $user->email,
                ]);

                return response()->json([
                    'message'   => 'Tautan reset berhasil digenerate.',
                    'reset_url' => $resetUrl,
                ]);
            })(),

            'send' => (function () use ($broker, $user) {
                $status = $broker->sendResetLink(['email' => $user->email]);
                if ($status === Password::RESET_LINK_SENT) {
                    return response()->json([
                        'message' => 'Tautan reset dikirim ke email pengguna.',
                    ]);
                }

                return response()->json([
                    'error' => __($status),
                ], 400);
            })(),

            default => response()->json([
                'error' => 'Invalid mode for reset password link.',
            ], 400),
        };
    }

    public function twoFactor(TwoFactorRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();
        $mode      = $validated['mode'] ?? null;

        return match ($mode) {
            'disable' => (function () use ($user) {
                $user->two_factor_secret         = null;
                $user->two_factor_recovery_codes = null;
                $user->two_factor_confirmed_at   = null;
                $user->save();

                return response()->json([
                    'message' => 'Two-factor authentication has been disabled.',
                ]);
            })(),

            'recovery_show' => (function () use ($user) {
                $codes = $this->twofa->parseRecoveryCodes($user->two_factor_recovery_codes);

                return response()->json([
                    'message' => 'Recovery codes retrieved successfully.',
                    'codes'   => $codes,
                ]);
            })(),

            'recovery_regenerate' => (function () use ($user) {
                $newCodes                        = $this->twofa->generateRecoveryCodes(8);
                $user->two_factor_recovery_codes = $newCodes;
                $user->save();

                return response()->json([
                    'message' => 'Recovery codes have been regenerated.',
                    'codes'   => $newCodes,
                ]);
            })(),

            default => response()->json([
                'message' => 'Invalid mode.',
            ], 400),
        };
    }

    public function forceLogout(ForceLogoutRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $scope = $validated['scope'];

        $latestTargetSessionId = Session::query()
            ->where('user_id', $user->id)
            ->orderByDesc('last_activity')
            ->value('id');

        $query = Session::query()->where('user_id', $user->id);
        if ($scope === 'all_except_current' && $latestTargetSessionId) {
            $query->where('id', '!=', $latestTargetSessionId);
        }

        $ids = $query->pluck('id');
        if ($ids->isEmpty()) {
            return back()->with('success', 'Tidak ada sesi yang perlu dihapus.');
        }

        Session::query()->whereIn('id', $ids)->delete();

        activity('system')
            ->performedOn($user)
            ->causedBy($request->user())
            ->withProperties(['scope' => $scope, 'reason' => $validated['reason'] ?? null, 'count' => $ids->count()])
            ->log('revoke_user_sessions');

        return back()->with('success', sprintf('Berhasil menghapus %d sesi pengguna.', $ids->count()));
    }
}
