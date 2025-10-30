<?php

namespace App\Services;

use App\Events\GlobalAnnouncementBroadcast;
use App\Events\RoleAnnouncementBroadcast;
use App\Events\SystemNotificationBroadcast;
use App\Jobs\SendUserNotification;
use App\Models\User;
use App\Services\Contracts\NotificationServiceInterface;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

class NotificationService implements NotificationServiceInterface
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
        $mergedMeta = (array) ($meta ?? []);
        if (!array_key_exists('scope', $mergedMeta)) {
            $mergedMeta['scope'] = (string) config('notifications.controller.default_scope', 'system');
        }

        $payload = [
            'title'      => $title,
            'message'    => $message,
            'action_url' => $actionUrl,
            'meta'       => $mergedMeta,
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
        Event::dispatch(new RoleAnnouncementBroadcast([
            'role_id'    => $roleId,
            'title'      => $title,
            'message'    => $message,
            'action_url' => $actionUrl,
            'persist'    => $persistPerUser,
            'meta'       => ['scope' => 'role', 'role_id' => $roleId],
        ]));

        if ($persistPerUser) {
            $role    = Role::query()->findOrFail($roleId);
            $chunk   = (int) config('notifications.fanout_chunk', 1000);
            $payload = [
                'title'      => $title,
                'message'    => $message,
                'action_url' => $actionUrl,
                'meta'       => ['scope' => 'role', 'role_id' => $roleId],
            ];
            $defaultConnection = (string) config('queue.default');
            $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');

            $role->users()->select('id')->orderBy('id')->chunkById($chunk, function ($users) use ($payload, $queueName, $roleId): void {
                $jobs = [];
                foreach ($users as $u) {
                    $jobs[] = new SendUserNotification((int) $u->id, $payload);
                }
                if ($jobs !== []) {
                    Bus::batch($jobs)
                        ->name('role-notifications-' . $roleId)
                        ->allowFailures()
                        ->onQueue($queueName)
                        ->dispatch();
                }
            });

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
        Event::dispatch(new GlobalAnnouncementBroadcast([
            'title'      => $title,
            'message'    => $message,
            'action_url' => $actionUrl,
            'persist'    => $persistPerUser,
            'meta'       => ['scope' => 'global'],
        ]));

        if ($persistPerUser) {
            $chunk   = (int) config('notifications.fanout_chunk', 1000);
            $payload = [
                'title'      => $title,
                'message'    => $message,
                'action_url' => $actionUrl,
                'meta'       => ['scope' => 'global'],
            ];
            $defaultConnection = (string) config('queue.default');
            $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');

            User::query()->select('id')->orderBy('id')->chunkById($chunk, function ($users) use ($payload, $queueName): void {
                $jobs = [];
                foreach ($users as $u) {
                    $jobs[] = new SendUserNotification((int) $u->id, $payload);
                }
                if ($jobs !== []) {
                    Bus::batch($jobs)
                        ->name('global-notifications')
                        ->allowFailures()
                        ->onQueue($queueName)
                        ->dispatch();
                }
            });

            return;
        }
    }

    /**
     * Broadcast a system-wide notification over private 'system' channel and optionally persist per user.
     *
     * @param array<string, mixed>|string $title
     * @param array<string, mixed>|string $message
     */
    public function system($title, $message, ?string $actionUrl = null, ?bool $persistPerUser = null, ?array $meta = null): void
    {
        $metaArr = (array) ($meta ?? []);
        $metaArr = array_merge(['scope' => 'system'], $metaArr);
        $persist = $persistPerUser ?? (bool) config('notifications.system.persist_default', true);

        Event::dispatch(new SystemNotificationBroadcast([
            'title'      => $title,
            'message'    => $message,
            'action_url' => $actionUrl,
            'meta'       => $metaArr,
        ]));

        if ($persist) {
            $chunk   = (int) config('notifications.fanout_chunk', 1000);
            $payload = [
                'title'      => $title,
                'message'    => $message,
                'action_url' => $actionUrl,
                'meta'       => $metaArr,
            ];
            $defaultConnection = (string) config('queue.default');
            $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');

            User::query()->select('id')->orderBy('id')->chunkById($chunk, function ($users) use ($payload, $queueName): void {
                $jobs = [];
                foreach ($users as $u) {
                    $jobs[] = new SendUserNotification((int) $u->id, $payload);
                }
                if ($jobs !== []) {
                    Bus::batch($jobs)
                        ->name('system-notifications')
                        ->allowFailures()
                        ->onQueue($queueName)
                        ->dispatch();
                }
            });
        }
    }
}
