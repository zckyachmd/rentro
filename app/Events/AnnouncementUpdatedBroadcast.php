<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementUpdatedBroadcast implements ShouldBroadcast
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public int $announcementId)
    {
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('management.announcements');
    }

    public function broadcastAs(): string
    {
        return 'management.announcement.updated';
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->announcementId];
    }
}
