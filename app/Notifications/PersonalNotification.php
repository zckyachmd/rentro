<?php

namespace App\Notifications;

use Illuminate\Broadcasting\PrivateChannel;
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
     * Customize the broadcast channel to match `private user.{id}`.
     */
    public function broadcastOn(): array
    {
        // @phpstan-ignore-next-line notifiable is User
        $id = (string) ($this->notifiable?->id ?? '');
        if ($id === '') {
            return [];
        }

        return [new PrivateChannel("user.$id")];
    }

    /**
     * Set a consistent event name for Echo listeners.
     */
    public function broadcastAs(): string
    {
        return 'user.notification';
    }
}
