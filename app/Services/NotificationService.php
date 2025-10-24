<?php

namespace App\Services;

use App\Events\GlobalAnnouncementBroadcast;
use App\Events\RoleAnnouncementBroadcast;
use App\Jobs\SendUserNotification;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

class NotificationService
{
    /**
     * Send a personal notification to a user and broadcast it on their private channel.
     *
     * @param array<string, mixed>|string $title
     * @param array<string, mixed>|string $message
     * @param string|null $actionUrl
     * @param array<string, mixed>|null $meta
     */
    public function notifyUser(int $userId, $title, $message, ?string $actionUrl = null, ?array $meta = null): void
    {
        $payload = [
            'title'      => $title,
            'message'    => $message,
            'action_url' => $actionUrl,
            'meta'       => $meta,
        ];

        SendUserNotification::dispatch($userId, $payload);
    }

    /**
     * Announce to a role, optionally persisting per user via queued fan-out.
     *
     * @param array<string, mixed>|string $title
     * @param array<string, mixed>|string $message
     */
    public function announceRole(int $roleId, $title, $message, ?string $actionUrl = null, bool $persistPerUser = false): void
    {
        // Always broadcast immediately to the role channel for realtime toast/sound
        Event::dispatch(new RoleAnnouncementBroadcast([
            'role_id'    => $roleId,
            'title'      => $title,
            'message'    => $message,
            'action_url' => $actionUrl,
            'persist'    => $persistPerUser,
        ]));

        if ($persistPerUser) {
            $role    = Role::query()->findOrFail($roleId);
            $chunk   = (int) config('notifications.fanout_chunk', 1000);
            $jobs    = [];
            $payload = [
                'title'      => $title,
                'message'    => $message,
                'action_url' => $actionUrl,
                'meta'       => ['scope' => 'role', 'role_id' => $roleId],
            ];

            $role->users()->select('id')->orderBy('id')->chunkById($chunk, function ($users) use (&$jobs, $payload): void {
                foreach ($users as $u) {
                    $jobs[] = new SendUserNotification((int) $u->id, $payload);
                }
            });

            if (count($jobs) > 0) {
                $defaultConnection = (string) config('queue.default');
                $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');
                Bus::batch($jobs)
                    ->name('role-notifications-' . $roleId)
                    ->allowFailures()
                    ->onQueue($queueName)
                    ->dispatch();
            }

            return;
        }
        // If not persisting, nothing else to do (broadcast already sent above)
    }

    /**
     * Announce to all users, optionally persisting per user via queued fan-out.
     *
     * @param array<string, mixed>|string $title
     * @param array<string, mixed>|string $message
     */
    public function announceGlobal($title, $message, ?string $actionUrl = null, bool $persistPerUser = false): void
    {
        // Always broadcast immediately to the global channel for realtime toast/sound
        Event::dispatch(new GlobalAnnouncementBroadcast([
            'title'      => $title,
            'message'    => $message,
            'action_url' => $actionUrl,
            'persist'    => $persistPerUser,
        ]));

        if ($persistPerUser) {
            $chunk   = (int) config('notifications.fanout_chunk', 1000);
            $payload = [
                'title'      => $title,
                'message'    => $message,
                'action_url' => $actionUrl,
                'meta'       => ['scope' => 'global'],
            ];

            $jobs = [];
            User::query()->select('id')->orderBy('id')->chunkById($chunk, function ($users) use (&$jobs, $payload): void {
                foreach ($users as $u) {
                    $jobs[] = new SendUserNotification((int) $u->id, $payload);
                }
            });

            if (count($jobs) > 0) {
                $defaultConnection = (string) config('queue.default');
                $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');
                Bus::batch($jobs)
                    ->name('global-notifications')
                    ->allowFailures()
                    ->onQueue($queueName)
                    ->dispatch();
            }

            return;
        }
    }
}
