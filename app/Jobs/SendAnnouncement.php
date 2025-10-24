<?php

namespace App\Jobs;

use App\Events\AnnouncementUpdatedBroadcast;
use App\Models\Announcement;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendAnnouncement implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $announcementId)
    {
        $defaultConnection = (string) config('queue.default');
        $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');
        $this->onQueue($queueName);
    }

    public function uniqueId(): string
    {
        return 'announcement:' . $this->announcementId;
    }

    public function handle(NotificationService $notifications): void
    {
        /** @var Announcement|null $a */
        $a = Announcement::find($this->announcementId);
        if (!$a) {
            return;
        }
        if ($a->status === 'sent') {
            return;
        }

        try {
            if ($a->scope === 'role' && $a->role_id) {
                $notifications->announceRole(
                    (int) $a->role_id,
                    $a->title,
                    $a->message,
                    $a->action_url,
                    (bool) $a->persist,
                );
            } else {
                $notifications->announceGlobal(
                    $a->title,
                    $a->message,
                    $a->action_url,
                    (bool) $a->persist,
                );
            }

            $a->forceFill([
                'status'  => 'sent',
                'sent_at' => now(),
            ])->save();

            event(new AnnouncementUpdatedBroadcast($a->id));
        } catch (\Throwable $e) {
            $a->forceFill([
                'status' => 'failed',
            ])->save();
            event(new AnnouncementUpdatedBroadcast($a->id));
            throw $e;
        }
    }
}
