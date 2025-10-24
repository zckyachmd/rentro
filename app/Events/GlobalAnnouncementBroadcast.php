<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GlobalAnnouncementBroadcast implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * @param array{title:string|array, message:string|array, action_url?:string|null} $payload
     */
    public function __construct(public array $payload)
    {
    }

    public function broadcastOn(): Channel
    {
        $name = (string) config('notifications.global_channel', 'global');
        if (config('notifications.global_private', false)) {
            return new \Illuminate\Broadcasting\PrivateChannel($name);
        }

        return new Channel($name);
    }

    public function broadcastAs(): string
    {
        return 'global.announcement';
    }

    /**
     * Keep broadcast payload minimal.
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'title'      => $this->payload['title'] ?? '',
            'message'    => $this->payload['message'] ?? '',
            'action_url' => $this->payload['action_url'] ?? null,
            'persist'    => (bool) ($this->payload['persist'] ?? false),
        ];
    }
}
