<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoleAnnouncementBroadcast implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * @param array{role_id:int, title:string|array, message:string|array, action_url?:string|null} $payload
     */
    public function __construct(public array $payload)
    {
    }

    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel('role.' . $this->payload['role_id']);
    }

    public function broadcastAs(): string
    {
        return 'role.announcement';
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
