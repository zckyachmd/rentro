<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SystemNotificationBroadcast implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * @param array{title?:string|array, message?:string|array, action_url?:string|null, meta?:array|null} $payload
     */
    public function __construct(public array $payload)
    {
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('system');
    }

    public function broadcastAs(): string
    {
        return 'system.notification';
    }

    /**
     * Keep payload minimal and consistent.
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'title'      => $this->payload['title'] ?? '',
            'message'    => $this->payload['message'] ?? '',
            'action_url' => $this->payload['action_url'] ?? null,
            'meta'       => $this->payload['meta'] ?? null,
        ];
    }
}
