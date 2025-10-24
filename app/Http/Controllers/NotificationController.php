<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * List notifications with pagination; filter unread/all via `?filter=unread|all`.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query  = $user->notifications()->orderByDesc('created_at');
        $filter = (string) $request->query('filter', 'all');
        if ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        $page  = $query->paginate(15)->withQueryString();
        $items = collect($page->items())->map(function (DatabaseNotification $n) {
            return [
                'id'         => (string) $n->id,
                'data'       => $n->data,
                'read_at'    => optional($n->read_at)->toDateTimeString(),
                'created_at' => optional($n->created_at)->toDateTimeString(),
            ];
        });

        // Keep paginator types intact; pass transformed items separately.

        return Inertia::render('notifications/index', [
            'page' => [
                'data'  => $items,
                'links' => [
                    'first' => $page->url(1),
                    'last'  => $page->url($page->lastPage()),
                    'prev'  => $page->previousPageUrl(),
                    'next'  => $page->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $page->currentPage(),
                    'last_page'    => $page->lastPage(),
                    'per_page'     => $page->perPage(),
                    'total'        => $page->total(),
                ],
            ],
            'filter'      => $filter,
            'unreadCount' => (int) $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(Request $request, string $id)
    {
        /** @var \Illuminate\Notifications\DatabaseNotification|null $n */
        $n = $request->user()->notifications()->whereKey($id)->first();
        if ($n) {
            $n->markAsRead();
        }

        if ($request->wantsJson()) {
            return response()->json(['status' => 'ok']);
        }

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        if ($request->wantsJson()) {
            return response()->json(['status' => 'ok']);
        }

        return back();
    }
}
