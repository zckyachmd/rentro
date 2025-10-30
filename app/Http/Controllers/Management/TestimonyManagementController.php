<?php

namespace App\Http\Controllers\Management;

use App\Enum\TestimonyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Testimony\UpdateTestimonyRequest;
use App\Models\Testimony;
use App\Services\Contracts\NotificationServiceInterface;
use App\Traits\DataTable;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class TestimonyManagementController extends Controller
{
    use DataTable;
    use LogActivity;

    public function __construct(private NotificationServiceInterface $notifications)
    {
    }

    public function index(Request $request)
    {
        $query = Testimony::query()->with(['user:id,name', 'curator:id,name']);

        $options = [
            'select'       => ['id', 'user_id', 'content_original', 'content_curated', 'status', 'curated_by', 'curated_at', 'published_at', 'created_at'],
            'search_param' => 'search',
            'searchable'   => ['content_original', 'content_curated'],
            'sortable'     => [
                'created_at' => 'created_at',
                'status'     => 'status',
            ],
            'default_sort' => ['created_at', 'desc'],
            'filters'      => [
                'status' => function ($q, $status) {
                    $allowed = array_map(fn (TestimonyStatus $s) => $s->value, TestimonyStatus::cases());
                    if (in_array($status, $allowed, true)) {
                        $q->where('status', $status);
                    }
                },
            ],
        ];

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\App\Models\Testimony> $page */
        $page       = $this->applyTable($query, $request, $options);
        $collection = $page->getCollection();
        /** @var \Illuminate\Support\Collection<int, \App\Models\Testimony> $collection */

        $mapped = $collection->map(function (Testimony $t): array {
            /** @var \App\Models\User|null $user */
            $user = $t->user;
            /** @var \App\Models\User|null $curator */
            $curator = $t->curator;

            return [
                'id'   => $t->id,
                'user' => [
                    'id'   => $user?->id,
                    'name' => $user?->name,
                ],
                'content_original' => $t->content_original,
                'content_curated'  => $t->content_curated,
                'status'           => $t->status->value,
                'curator'          => $curator ? ['id' => $curator->id, 'name' => $curator->name] : null,
                'curated_at'       => optional($t->curated_at)->toDateTimeString(),
                'published_at'     => optional($t->published_at)->toDateTimeString(),
                'created_at'       => optional($t->created_at)->toDateTimeString(),
            ];
        });

        $page->setCollection($mapped);

        $payload = $this->tablePaginate($page);

        return Inertia::render('management/testimonies/index', [
            'testimonies' => $payload,
            'query'       => [
                'page'    => $payload['current_page'],
                'perPage' => $payload['per_page'],
                'sort'    => $request->query('sort'),
                'dir'     => $request->query('dir'),
                'search'  => $request->query('search'),
                'status'  => $request->query('status'),
            ],
            'page' => [
                'title' => __('management/testimony.title'),
                'desc'  => __('management/testimony.desc'),
            ],
        ]);
    }

    public function update(UpdateTestimonyRequest $request, Testimony $testimony): RedirectResponse
    {
        $validated = $request->validated();

        $before = $testimony->only(['content_curated', 'status']);

        $testimony->content_curated = $validated['content_curated'] ?? null;
        $testimony->status          = TestimonyStatus::from($validated['status']);

        // Set curator metadata when curating or changing status
        $testimony->curated_by = $request->user()->id;
        if (!empty($validated['content_curated']) && empty($testimony->curated_at)) {
            $testimony->curated_at = Carbon::now();
        }

        // Manage published_at timestamp
        if ($testimony->status === TestimonyStatus::PUBLISHED) {
            $testimony->published_at = $testimony->published_at ?? Carbon::now();
        } else {
            $testimony->published_at = null;
        }

        $testimony->save();

        $after = $testimony->only(['content_curated', 'status']);
        if ($before !== $after) {
            $this->logEvent(
                event: 'testimony_updated',
                causer: $request->user(),
                subject: $testimony,
                properties: [
                    'before' => $before,
                    'after'  => $after,
                ],
            );
        }

        try {
            $targetUserId = (int) $testimony->user_id;
            if ($targetUserId > 0 && $before['status'] !== $after['status']) {
                $event   = strtolower((string) $testimony->status->value);
                $title   = ['key' => 'notifications.content.testimony.status.title'];
                $message = [
                    'key'    => 'notifications.content.testimony.status.message',
                    'params' => ['status' => $event],
                ];
                $actionUrl = route('dashboard');
                $this->notifications->notifyUser($targetUserId, $title, $message, $actionUrl, [
                    'scope'        => 'user',
                    'type'         => 'testimony',
                    'event'        => 'status_changed',
                    'status'       => $event,
                    'testimony_id' => (string) $testimony->id,
                ]);
            }
        } catch (\Throwable) {
            // ignore;
        }

        return back()->with('success', __('management/testimony.updated'));
    }

    public function destroy(Testimony $testimony): RedirectResponse
    {
        $snapshot = $testimony->only(['id', 'user_id', 'status']);
        $testimony->delete();

        $this->logEvent(
            event: 'testimony_deleted',
            causer: request()->user(),
            subject: $testimony,
            properties: $snapshot,
        );

        return back()->with('success', __('management/testimony.deleted'));
    }
}
