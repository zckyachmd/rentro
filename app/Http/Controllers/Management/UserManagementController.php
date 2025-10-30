<?php

namespace App\Http\Controllers\Management;

use App\Enum\CacheKey;
use App\Enum\DocumentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\User\CreateUserRequest;
use App\Http\Requests\Management\User\ForceLogoutRequest;
use App\Http\Requests\Management\User\ResetPasswordRequest;
use App\Http\Requests\Management\User\TwoFactorRequest;
use App\Http\Requests\Management\User\UpdateRolesRequest;
use App\Jobs\SendUserInvitationEmail;
use App\Models\Session;
use App\Models\User;
use App\Models\UserDocument;
use App\Services\Contracts\NotificationServiceInterface;
use App\Services\Contracts\TwoFactorServiceInterface;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function __construct(private TwoFactorServiceInterface $twofa, private NotificationServiceInterface $notifications)
    {
    }

    public function index(Request $request)
    {
        $query = User::query();

        $options = [
            'select'       => ['id', 'name', 'email', 'phone', 'two_factor_secret', 'two_factor_confirmed_at', 'avatar_path'],
            'with'         => ['roles:id,name', 'latestSession', 'document'],
            'search_param' => 'search',
            'searchable'   => ['name', 'email', 'phone'],
            'sortable'     => [
                'name'           => 'name',
                'email'          => 'email',
                'last_active_at' => function ($q, $dir) {
                    $q->orderBy(
                        \App\Models\Session::query()
                            ->selectRaw('MAX(last_activity)')
                            ->whereColumn('sessions.user_id', 'users.id'),
                        $dir,
                    );
                },
            ],
            'default_sort' => ['name', 'asc'],
            'filters'      => [
                'role_id' => function ($q, $roleId) {
                    $q->whereHas('roles', fn ($r) => $r->where('id', $roleId));
                },
                'document_status' => function ($q, $status) {
                    $status = is_string($status) ? trim(strtolower($status)) : null;
                    if (!$status) {
                        return;
                    }
                    $q->whereHas('document', function ($d) use ($status) {
                        $d->where('status', $status);
                    });
                },
                'email_verified' => function ($q, $v) {
                    $val = is_string($v) ? trim(strtolower($v)) : null;
                    if ($val === 'verified' || $val === 'yes' || $val === '1' || $val === 'true') {
                        $q->whereNotNull('email_verified_at');
                    } elseif ($val === 'unverified' || $val === 'no' || $val === '0' || $val === 'false') {
                        $q->whereNull('email_verified_at');
                    }
                },
                'twofa' => function ($q, $v) {
                    $val = is_string($v) ? trim(strtolower($v)) : null;
                    if ($val === 'enabled') {
                        $q->whereNotNull('two_factor_secret')->whereNotNull('two_factor_confirmed_at');
                    } elseif ($val === 'disabled') {
                        $q->where(function ($qq) {
                            $qq->whereNull('two_factor_secret')->orWhereNull('two_factor_confirmed_at');
                        });
                    }
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\App\Models\User> $page */
        $page = $this->applyTable($query, $request, $options);

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $collection */
        $collection = $page->getCollection();

        $mapped = $collection->map(function (User $u): array {
            $last = null;
            $sess = $u->latestSession;
            if ($sess?->last_activity) {
                $ts   = (int) $sess->last_activity;
                $last = Carbon::createFromTimestamp($ts, config('app.timezone'))->diffForHumans();
            }

            /** @var \Illuminate\Support\Collection<int, \Spatie\Permission\Models\Role> $roles */
            $roles = $u->roles;

            $doc              = $u->document;
            $attachmentsCount = 0;
            if ($doc && method_exists($doc, 'getAttachments')) {
                $attachmentsCount = count($doc->getAttachments('private'));
            }

            return [
                'id'                 => $u->id,
                'name'               => $u->name,
                'email'              => $u->email,
                'avatar'             => $u->avatar_url ?? null,
                'phone'              => $u->phone ?? null,
                'roles'              => $roles->map(fn (Role $r) => ['id' => $r->id, 'name' => $r->name])->values()->all(),
                'two_factor_enabled' => !empty($u->two_factor_secret) && !empty($u->two_factor_confirmed_at),
                'last_active_at'     => $last,
                'document'           => $doc ? [
                    'id'          => $doc->id,
                    'status'      => ($doc->status instanceof \BackedEnum) ? $doc->status->value : $doc->status,
                    'type'        => ($doc->type instanceof \BackedEnum) ? $doc->type->value : $doc->type,
                    'attachments' => $attachmentsCount,
                    'has_file'    => $attachmentsCount > 0,
                ] : null,
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

        return Inertia::render('management/user/index', [
            'users' => $usersPayload,
            'roles' => $roles,
            'query' => [
                'page'           => $usersPayload['current_page'],
                'perPage'        => $usersPayload['per_page'],
                'sort'           => $request->query('sort'),
                'dir'            => $request->query('dir'),
                'search'         => $request->query('search'),
                'roleId'         => $request->query('role_id'),
                'documentStatus' => $request->query('document_status'),
                'emailVerified'  => $request->query('email_verified'),
                'twofa'          => $request->query('twofa'),
            ],
        ]);
    }

    public function show(User $user)
    {
        $user->load([
            'addresses' => fn ($q) => $q->orderBy('id'),
            'document',
            'emergencyContacts' => fn ($q) => $q->orderBy('id'),
        ]);

        $doc           = $user->document;
        $hasAttachment = $doc && method_exists($doc, 'getAttachments') && !empty($doc->getAttachments('private'));
        $docDto        = $doc ? [
            'id'          => $doc->id,
            'type'        => ($doc->type instanceof \BackedEnum) ? $doc->type->value : $doc->type,
            'number'      => $doc->number,
            'issued_at'   => $doc->issued_at,
            'expires_at'  => $doc->expires_at,
            'status'      => ($doc->status instanceof \BackedEnum) ? $doc->status->value : $doc->status,
            'verified_at' => $doc->verified_at,
            'has_file'    => $hasAttachment,
            'attachments' => $doc->getAttachments('private'),
            'notes'       => $doc->notes,
        ] : null;

        return Inertia::render('management/user/show', [
            'user' => $user->append('avatar_url')->only([
                'id', 'name', 'username', 'email', 'phone', 'gender', 'dob', 'avatar_url', 'created_at', 'email_verified_at',
            ]),
            'addresses' => $user->addresses->map->only([
                'id', 'label', 'address_line', 'village', 'district', 'city', 'province', 'postal_code', 'country', 'is_primary',
            ]),
            'document' => $docDto,
            'contacts' => $user->emergencyContacts->map->only([
                'id', 'name', 'relationship', 'phone', 'email', 'address_line', 'is_primary',
            ]),
            'options' => [
                'documentTypes'    => \App\Enum\DocumentType::values(),
                'documentStatuses' => \App\Enum\DocumentStatus::values(),
            ],
        ]);
    }

    public function documentAttachment(User $user, string $path)
    {
        $doc = $user->document;
        abort_unless($doc instanceof UserDocument, 404);

        $raw      = urldecode(trim($path));
        $bucket   = str_contains($raw, '/private/') ? 'private' : (str_contains($raw, '/public/') || str_contains($raw, '/general/') ? 'public' : null);
        $resolved = $doc->resolveAttachmentPath($raw, $bucket);
        $disk     = $doc->attachmentDiskName($bucket);

        abort_unless($resolved && Storage::disk($disk)->exists($resolved), 404);

        return response()->file(Storage::disk($disk)->path($resolved));
    }

    public function approveDocument(Request $request, User $user): RedirectResponse
    {
        /** @var UserDocument|null $doc */
        $doc = $user->document;
        if (!$doc) {
            return back()->with('error', __('management/users.document.not_found'));
        }

        if ($doc->status !== DocumentStatus::PENDING) {
            return back()->with('error', __('management/users.document.invalid_status'));
        }

        $note = null;
        if ($request->filled('note')) {
            $note = trim((string) $request->input('note'));
            if ($note === '') {
                $note = null;
            }
        }

        $doc->status      = DocumentStatus::APPROVED;
        $doc->verified_at = now();
        $doc->notes       = $note;
        $doc->save();

        activity()
            ->performedOn($doc)
            ->causedBy($request->user())
            ->event('user_document_approved')
            ->withProperties([
                'user_id' => $user->id,
            ])
            ->log('User document approved by admin');

        try {
            $actionUrl = route('profile.edit');
            $title     = ['key' => 'notifications.content.document.approved.title'];
            $message   = ['key' => 'notifications.content.document.approved.message'];
            $this->notifications->notifyUser((int) $user->id, $title, $message, $actionUrl, [
                'scope'    => 'user',
                'type'     => 'document',
                'event'    => 'approved',
                'document' => $doc->only(['id', 'type', 'number']),
            ]);
        } catch (\Throwable) {
            // ignore;
        }

        return back()->with('success', __('management/users.document.approved'));
    }

    public function rejectDocument(Request $request, User $user): RedirectResponse
    {
        /** @var UserDocument|null $doc */
        $doc = $user->document;
        if (!$doc) {
            return back()->with('error', __('management/users.document.not_found'));
        }

        if ($doc->status !== DocumentStatus::PENDING) {
            return back()->with('error', __('management/users.document.invalid_status'));
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10'],
        ]);

        $doc->status      = DocumentStatus::REJECTED;
        $doc->verified_at = null;
        $doc->notes       = $validated['reason'];
        $doc->save();

        activity()
            ->performedOn($doc)
            ->causedBy($request->user())
            ->event('user_document_rejected')
            ->withProperties([
                'user_id' => $user->id,
            ])
            ->log('User document rejected by admin');

        try {
            $actionUrl = route('profile.edit');
            $title     = ['key' => 'notifications.content.document.rejected.title'];
            $message   = ['key' => 'notifications.content.document.rejected.message'];
            $this->notifications->notifyUser((int) $user->id, $title, $message, $actionUrl, [
                'scope'    => 'user',
                'type'     => 'document',
                'event'    => 'rejected',
                'document' => $doc->only(['id', 'type', 'number']),
                'reason'   => $validated['reason'],
            ]);
        } catch (\Throwable) {
            // ignore;
        }

        return back()->with('success', __('management/users.document.rejected'));
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

        $inviteOk = false;
        try {
            SendUserInvitationEmail::dispatch($user->id, $user->username, $tempPassword, $resetUrl);
            $inviteOk = true;
        } catch (\Throwable $e) {
            $inviteOk = false;
        }

        $verificationRequested = (bool) ($validated['send_verification'] ?? false);
        $verifyOk              = false;
        if ($verificationRequested && !$user->hasVerifiedEmail()) {
            try {
                $user->sendEmailVerificationNotification();
                $verifyOk = true;
            } catch (\Throwable $e) {
                $verifyOk = false;
            }
        }

        $this->logEvent(
            event: 'invited_user',
            causer: $request->user(),
            subject: $user,
            properties: [
                'roles'      => $roles->pluck('name')->values()->all(),
                'invited_by' => $request->user()?->id,
                'invited_at' => now(),
            ],
        );

        $messages = [];
        $status   = 'success';

        $messages[] = __('management/users.created');
        if ($inviteOk) {
            $messages[] = __('management/users.invite.sent');
        } else {
            $messages[] = __('management/users.invite.failed');
            $status     = 'warning';
        }
        if ($verificationRequested) {
            if ($verifyOk) {
                $messages[] = __('management/users.verify.sent');
            } else {
                $messages[] = __('management/users.verify.failed');
                if ($status === 'success') {
                    $status = 'warning';
                }
            }
        }

        return back()->with($status, implode(' ', $messages));
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
            return back()->with('success', __('management/users.roles.no_changes'));
        }

        $user->syncRoles($roles);

        return back()->with('success', __('management/users.roles.updated'));
    }

    public function resetPasswordLink(ResetPasswordRequest $request, User $user)
    {
        if (!$user->email) {
            if ($request->input('mode') === 'generate') {
                return response()->json(['message' => __('management/users.email_missing')], 400);
            }

            return back()->with('error', __('management/users.email_missing'));
        }

        $validated = $request->validated();
        /** @var \Illuminate\Auth\Passwords\PasswordBroker $broker */
        $broker = Password::broker();

        $mode = $validated['mode'] ?? 'send';

        return match ($mode) {
            'generate' => (function () use ($broker, $user, $request) {
                $token    = $broker->createToken($user);
                $resetUrl = route('password.reset', [
                    'token' => $token,
                    'email' => $user->email,
                ]);

                $this->logEvent(
                    event: 'password_reset_link_generated',
                    causer: $request->user(),
                    subject: $user,
                    properties: [
                        'mode'     => 'generate',
                        'delivery' => 'manual',
                        'email'    => $user->email,
                        'reason'   => $request->input('reason'),
                    ],
                );

                return response()->json([
                    'message'   => __('management/users.reset_link_generated'),
                    'reset_url' => $resetUrl,
                ]);
            })(),

            'send' => (function () use ($broker, $user, $request) {
                $status = $broker->sendResetLink(['email' => $user->email]);
                if ($status === Password::RESET_LINK_SENT) {
                    $this->logEvent(
                        event: 'password_reset_link_sent',
                        causer: $request->user(),
                        subject: $user,
                        properties: [
                            'mode'     => 'send',
                            'delivery' => 'email',
                            'email'    => $user->email,
                            'status'   => $status,
                            'reason'   => $request->input('reason'),
                        ],
                    );

                    return back()->with('success', __('management/users.reset_link_sent'));
                }

                $this->logEvent(
                    event: 'password_reset_link_send_failed',
                    causer: $request->user(),
                    subject: $user,
                    properties: [
                        'mode'     => 'send',
                        'delivery' => 'email',
                        'email'    => $user->email,
                        'status'   => $status,
                        'reason'   => $request->input('reason'),
                    ],
                );

                return back()->with('error', __($status));
            })(),

            default => (function () use ($request, $validated, $user) {
                $this->logEvent(
                    event: 'password_reset_invalid_mode',
                    causer: $request->user(),
                    subject: $user,
                    properties: [
                        'mode' => $validated['mode'] ?? null,
                    ],
                );

                // If FE sent JSON (e.g., for generate), return JSON error
                if ($request->input('mode') === 'generate') {
                    return response()->json([
                        'message' => __('management/users.reset_mode_invalid'),
                    ], 400);
                }

                return back()->with('error', __('management/users.reset_mode_invalid'));
            })(),
        };
    }

    public function twoFactor(TwoFactorRequest $request, User $user)
    {
        $validated = $request->validated();
        $mode      = $validated['mode'] ?? null;

        return match ($mode) {
            'disable' => (function () use ($user, $request) {
                $user->two_factor_secret         = null;
                $user->two_factor_recovery_codes = null;
                $user->two_factor_confirmed_at   = null;
                $user->save();

                $this->logEvent(
                    event: 'two_factor_disabled',
                    causer: $request->user(),
                    subject: $user,
                    properties: [
                        'method' => 'totp',
                        'reason' => $request->input('reason'),
                    ],
                );

                return back()->with('success', __('management/users.2fa.disabled'));
            })(),

            'recovery_show' => (function () use ($user, $request) {
                $codes = $this->twofa->parseRecoveryCodes($user->two_factor_recovery_codes);

                $this->logEvent(
                    event: 'two_factor_recovery_viewed',
                    causer: $request->user(),
                    subject: $user,
                    properties: [
                        'codes_count' => count($codes),
                        'reason'      => $request->input('reason'),
                    ],
                );

                return response()->json([
                    'message' => __('management/users.recovery.retrieved'),
                    'codes'   => $codes,
                ]);
            })(),

            'recovery_regenerate' => (function () use ($user, $request) {
                $newCodes                        = $this->twofa->generateRecoveryCodes();
                $user->two_factor_recovery_codes = $newCodes;
                $user->save();

                $this->logEvent(
                    event: 'two_factor_recovery_regenerated',
                    causer: $request->user(),
                    subject: $user,
                    properties: [
                        'reason' => $request->input('reason'),
                    ],
                );

                return response()->json([
                    'message' => __('management/users.recovery.regenerated'),
                    'codes'   => $newCodes,
                ]);
            })(),

            default => (function () use ($request, $validated, $user) {
                $this->logEvent(
                    event: 'two_factor_invalid_mode',
                    causer: $request->user(),
                    subject: $user,
                    properties: [
                        'mode' => $validated['mode'] ?? null,
                    ],
                );

                return response()->json([
                    'message' => __('management/users.invalid_mode'),
                ], 400);
            })(),
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
            return back()->with('success', __('management/users.sessions.none'));
        }

        Session::query()->whereIn('id', $ids)->delete();

        $this->logEvent(
            event: 'revoke_user_sessions',
            causer: $request->user(),
            subject: $user,
            properties: [
                'scope'  => $scope,
                'reason' => $validated['reason'] ?? null,
                'count'  => $ids->count(),
            ],
        );

        return back()->with('success', __('management/users.sessions.deleted_count', ['count' => $ids->count()]));
    }
}
