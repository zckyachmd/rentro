<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

/**
 * RealtimeAppNotification: compact DB + broadcast payload for user-specific notifications.
 *
 * Payload structure:
 * - id (uuid, broadcast only when available)
 * - type (class basename)
 * - title (string)
 * - message (string)
 * - url (string|null)
 * - created_at (ISO string)
 */
class RealtimeAppNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public ?string $url = null,
    ) {
        $defaultConnection = (string) config('queue.default');
        $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');
        $this->onQueue($queueName);
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Data persisted in notifications table.
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title'      => $this->title,
            'message'    => $this->message,
            'url'        => $this->url,
            'created_at' => now()->toISOString(),
        ];
    }

    /**
     * Data broadcast over websockets (includes id/type when available).
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $base         = $this->toArray($notifiable);
        $base['type'] = class_basename(static::class);
        $base['id']   = $this->id;

        return new BroadcastMessage($base);
    }

    /**
     * Use private user.{id} channel for Echo subscribers.
     */
    public function broadcastOn(): array
    {
        // Return empty array to let Laravel fall back to
        // Rely on notifiable->receivesBroadcastNotificationsOn() fallback
        return [];
    }

    public function broadcastType(): string
    {
        return 'user.notification';
    }
}
