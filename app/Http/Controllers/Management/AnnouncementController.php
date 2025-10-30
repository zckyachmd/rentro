<?php

namespace App\Http\Controllers\Management;

use App\Events\AnnouncementCreatedBroadcast;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Announcement\AnnouncementGlobalRequest;
use App\Http\Requests\Management\Announcement\AnnouncementRoleRequest;
use App\Http\Requests\Management\Announcement\AnnouncementStoreRequest;
use App\Jobs\SendAnnouncement;
use App\Models\Announcement;
use App\Models\User;
use App\Services\Contracts\NotificationServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Spatie\Permission\Models\Role;

class AnnouncementController extends Controller
{
    public function __construct(private NotificationServiceInterface $notifications)
    {
    }

    /**
     * GET /management/announcements.
     */
    public function index(Request $request): InertiaResponse
    {
        $roles = Role::query()->select(['id', 'name'])->orderBy('name')->get();
        // Lightweight user list for compose dialog (first 50 by name)
        $users = User::query()->select(['id', 'name', 'email'])->orderBy('name')->limit(50)->get();

        $q       = trim((string) $request->query('q', ''));
        $scope   = (string) $request->query('scope', ''); // '', 'global', 'role'
        $status  = (string) $request->query('status', '');
        $roleId  = (int) $request->query('role_id', 0);
        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $sort    = (string) $request->query('sort', 'created_at');
        $dir     = strtolower((string) $request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSort = ['created_at', 'scheduled_at', 'status', 'title', 'scope'];
        if (!in_array($sort, $allowedSort, true)) {
            $sort = 'created_at';
        }

        $query = Announcement::query();
        if ($q !== '') {
            $query->where('title', 'ILIKE', '%' . $q . '%');
        }
        if (in_array($scope, ['global', 'role'], true)) {
            $query->where('scope', $scope);
        }
        if ($status !== '') {
            // Whitelist allowed statuses to avoid invalid filtering values
            $allowedStatuses = ['pending', 'queued', 'scheduled', 'sent', 'failed'];
            if (in_array($status, $allowedStatuses, true)) {
                $query->where('status', $status);
            }
        }
        if ($roleId > 0) {
            $query->where('role_id', $roleId)->where('scope', 'role');
        }

        $query->orderBy($sort, $dir)->orderByDesc('id');

        /** @var \Illuminate\Pagination\LengthAwarePaginator $page */
        $page = $query->paginate($perPage)->appends($request->query());

        $rows = collect($page->items())->map(function (Announcement $a) use ($roles) {
            $roleName = null;
            if ($a->scope === 'role' && $a->role_id) {
                $roleName = optional($roles->firstWhere('id', $a->role_id))->name;
            }

            return [
                'id'           => (int) $a->id,
                'scope'        => $a->scope,
                'role_id'      => $a->role_id ? (int) $a->role_id : null,
                'role_name'    => $roleName,
                'title'        => $a->title,
                'message'      => $a->message,
                'action_url'   => $a->action_url,
                'persist'      => (bool) $a->persist,
                'scheduled_at' => optional($a->scheduled_at)->toDateTimeString(),
                'sent_at'      => optional($a->sent_at)->toDateTimeString(),
                'status'       => $a->status,
                'created_at'   => optional($a->created_at)->toDateTimeString(),
            ];
        })->values();

        $paginator = [
            'total'        => $page->total(),
            'from'         => $page->firstItem(),
            'to'           => $page->lastItem(),
            'current_page' => $page->currentPage(),
            'last_page'    => $page->lastPage(),
            'per_page'     => $page->perPage(),
        ];

        return Inertia::render('management/announcements/index', [
            'roles' => $roles->map(fn (Role $r) => ['id' => (int) $r->id, 'name' => $r->name])->values(),
            'users' => $users->map(fn (User $u) => [
                'id'    => (int) $u->id,
                'name'  => $u->name,
                'email' => $u->email,
            ])->values(),
            'rows'      => $rows,
            'paginator' => $paginator,
            'filters'   => [
                'q'       => $q,
                'scope'   => $scope,
                'status'  => $status,
                'role_id' => $roleId > 0 ? $roleId : null,
                'sort'    => $sort,
                'dir'     => $dir,
            ],
        ]);
    }

    /**
     * POST /management/announcements/role.
     */
    public function role(AnnouncementRoleRequest $request)
    {
        $data = $request->validated();

        $persist = (bool) ($data['persist'] ?? false);

        $this->notifications->announceRole(
            (int) $data['role_id'],
            $data['title'],
            $data['message'],
            $data['action_url'] ?? null,
            $persist,
        );

        if ($request->wantsJson()) {
            return response()->json(['status' => 'ok']);
        }

        return Redirect::back()->with('status', 'role_announcement_sent');
    }

    /**
     * POST /management/announcements/global.
     */
    public function global(AnnouncementGlobalRequest $request)
    {
        $data = $request->validated();

        $persist = (bool) ($data['persist'] ?? false);

        $this->notifications->announceGlobal(
            $data['title'],
            $data['message'],
            $data['action_url'] ?? null,
            $persist,
        );

        if ($request->wantsJson()) {
            return response()->json(['status' => 'ok']);
        }

        return Redirect::back()->with('status', 'global_announcement_sent');
    }

    /**
     * Unified store endpoint: POST /management/announcements.
     */
    public function store(AnnouncementStoreRequest $request)
    {
        $data = $request->validated();

        // Special-case: send to specific user (do not create Announcement row)
        if ($data['target'] === 'user') {
            $userId = (int) ($data['user_id'] ?? 0);
            if ($userId <= 0) {
                return back()->withErrors(['user_id' => 'User is required'])->withInput();
            }
            $payload = [
                'title'      => $data['title'],
                'message'    => $data['message'],
                'action_url' => $data['action_url'] ?? null,
                'meta'       => ['scope' => 'user'],
            ];
            $scheduledAt = isset($data['scheduled_at']) && $data['scheduled_at']
                ? \Carbon\Carbon::parse((string) $data['scheduled_at'])
                : null;
            if ($scheduledAt && now()->lt($scheduledAt)) {
                dispatch(new \App\Jobs\SendUserNotification($userId, $payload))->delay($scheduledAt);
            } else {
                dispatch(new \App\Jobs\SendUserNotification($userId, $payload));
            }

            if ($request->wantsJson()) {
                return response()->json(['status' => 'ok']);
            }

            return Redirect::route('management.announcements.index')->with('success', 'Notification queued');
        }

        $a               = new Announcement();
        $a->scope        = $data['target'];
        $a->role_id      = $data['target'] === 'role' ? ($data['role_id'] ?? null) : null;
        $a->title        = $data['title'];
        $a->message      = $data['message'];
        $a->action_url   = $data['action_url'] ?? null;
        $a->persist      = (bool) ($data['persist'] ?? false);
        $a->scheduled_at = isset($data['scheduled_at']) && $data['scheduled_at']
            ? \Carbon\Carbon::parse((string) $data['scheduled_at'])
            : null;
        $a->status     = $a->scheduled_at && now()->lt($a->scheduled_at) ? 'scheduled' : 'queued';
        $a->created_by = (int) $request->user()->id;
        $a->save();

        // Broadcast creation to management channel for realtime tables
        event(new AnnouncementCreatedBroadcast($a->id));

        $job = new SendAnnouncement($a->id);
        if ($a->scheduled_at && now()->lt($a->scheduled_at)) {
            dispatch($job)->delay($a->scheduled_at);
        } else {
            dispatch($job);
        }

        if ($request->wantsJson()) {
            return response()->json(['status' => 'ok', 'id' => $a->id]);
        }

        return Redirect::route('management.announcements.index')->with('success', 'Announcement queued');
    }

    /**
     * POST /management/announcements/{announcement}/send-now.
     */
    public function sendNow(Request $request, Announcement $announcement)
    {
        if ($announcement->status === 'sent') {
            return Redirect::back()->with('info', 'Already sent');
        }

        $announcement->forceFill([
            'scheduled_at' => null,
            'status'       => 'queued',
        ])->save();

        dispatch(new SendAnnouncement($announcement->id));

        if ($request->wantsJson()) {
            return response()->json(['status' => 'ok']);
        }

        return Redirect::back()->with('success', 'Announcement queued to send now');
    }

    /**
     * POST /management/announcements/{announcement}/resend
     * Create a new announcement from an existing one and queue it immediately.
     */
    public function resend(Request $request, Announcement $announcement)
    {
        $b               = new Announcement();
        $b->scope        = $announcement->scope;
        $b->role_id      = $announcement->scope === 'role' ? $announcement->role_id : null;
        $b->title        = $announcement->title;
        $b->message      = $announcement->message;
        $b->action_url   = $announcement->action_url;
        $b->persist      = (bool) $announcement->persist;
        $b->scheduled_at = null;
        $b->status       = 'queued';
        $b->created_by   = (int) $request->user()->id;
        $b->save();

        // Broadcast creation to management channel for realtime tables
        event(new AnnouncementCreatedBroadcast($b->id));

        dispatch(new SendAnnouncement($b->id));

        if ($request->wantsJson()) {
            return response()->json(['status' => 'ok', 'id' => $b->id]);
        }

        return Redirect::back()->with('success', 'Announcement re-queued');
    }

    /**
     * POST /management/announcements/{announcement}/cancel
     * Cancel a scheduled announcement without deleting the record.
     */
    public function cancelSchedule(Request $request, Announcement $announcement)
    {
        // Only meaningful when currently scheduled; but allow from any non-sent state
        if ($announcement->status === 'sent') {
            return Redirect::back()->with('info', 'Already sent');
        }

        $announcement->forceFill([
            'scheduled_at' => null,
            'status'       => 'pending',
        ])->save();

        // Broadcast update so management table refreshes
        event(new \App\Events\AnnouncementUpdatedBroadcast($announcement->id));

        if ($request->wantsJson()) {
            return response()->json(['status' => 'ok']);
        }

        return Redirect::back()->with('success', 'Schedule cancelled');
    }
}
