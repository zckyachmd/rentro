<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

/**
 * Personal notification stored in database and broadcast over Reverb.
 *
 * Data fields:
 * - title (string|array key)
 * - message (string|array key)
 * - action_url (string|null)
 * - meta (array|null)
 * - created_at (ISO string)
 */
class PersonalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param array{title:string|array, message:string|array, action_url?:string|null, meta?:array|null} $payload
     */
    public function __construct(public array $payload)
    {
        $defaultConnection = (string) config('queue.default');
        $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');
        $this->onQueue($queueName);
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Data to persist in the notifications table.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title'      => $this->payload['title'] ?? '',
            'message'    => $this->payload['message'] ?? '',
            'action_url' => $this->payload['action_url'] ?? null,
            'meta'       => $this->payload['meta'] ?? null,
            'created_at' => now()->toISOString(),
        ];
    }

    /**
     * Data to broadcast over websockets.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    /**
     * Customize the broadcast channel. Return empty to use the model's
     * receivesBroadcastNotificationsOn() fallback.
     */
    public function broadcastOn(): array
    {
        return [];
    }

    /**
     * Set a consistent event name for Echo listeners.
     */
    public function broadcastType(): string
    {
        return 'user.notification';
    }
}
