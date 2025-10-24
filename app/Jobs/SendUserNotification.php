<?php

namespace App\Jobs;

use App\Models\User;
use App\Notifications\PersonalNotification;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Queue job to send a personal notification to a user.
 */
class SendUserNotification implements ShouldQueue, ShouldBeUnique
{
    use Batchable;
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param array{title:string|array, message:string|array, action_url?:string|null, meta?:array|null} $payload
     */
    public function __construct(public int $userId, public array $payload)
    {
        $defaultConnection = (string) config('queue.default');
        $queueName         = (string) config("queue.connections.$defaultConnection.queue", 'default');
        $this->onQueue($queueName);
    }

    /**
     * Prevent duplicate fan-out within a small time window.
     */
    public int $uniqueFor = 60;

    public function uniqueId(): string
    {
        $key = json_encode([
            'user'  => $this->userId,
            'title' => $this->payload['title'] ?? '',
            'msg'   => $this->payload['message'] ?? '',
            'url'   => $this->payload['action_url'] ?? null,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return sha1($key ?: uniqid('notify', true));
    }

    public function handle(): void
    {
        $user = User::query()->find($this->userId);
        if (!$user) {
            return;
        }

        $user->notify(new PersonalNotification($this->payload));
    }
}
