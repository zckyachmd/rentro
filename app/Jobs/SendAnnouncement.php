<?php

namespace App\Jobs;

use App\Events\AnnouncementUpdatedBroadcast;
use App\Models\Announcement;
use App\Services\Contracts\NotificationServiceInterface;
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

    public function handle(NotificationServiceInterface $notifications): void
    {
        /** @var Announcement|null $a */
        $a = Announcement::find($this->announcementId);
        if (!$a) {
            return;
        }
        // Only send when queued/scheduled. Allow safe no-op when cancelled/pending/etc.
        if ($a->status === 'sent' || !in_array($a->status, ['queued', 'scheduled'], true)) {
            return;
        }

        try {
            $decode = function ($val) {
                if (is_array($val)) {
                    return $val;
                }
                if (is_string($val)) {
                    $trim = trim($val);
                    if (str_starts_with($trim, '{') && str_ends_with($trim, '}')) {
                        try {
                            $arr = json_decode($trim, true, 512, JSON_THROW_ON_ERROR);
                            if (is_array($arr)) {
                                return $arr;
                            }
                        } catch (\Throwable) {
                            // stay string
                        }
                    }
                }

                return $val;
            };
            if ($a->scope === 'role' && $a->role_id) {
                $notifications->announceRole(
                    (int) $a->role_id,
                    $decode($a->title),
                    $decode($a->message),
                    $a->action_url,
                    (bool) $a->persist,
                );
            } else {
                $notifications->announceGlobal(
                    $decode($a->title),
                    $decode($a->message),
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
