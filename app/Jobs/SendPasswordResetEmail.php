<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPasswordResetEmail implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $userId, public string $token)
    {
        $this->onQueue('mail');
    }

    public function handle(): void
    {
        $user = User::query()->find($this->userId);
        if (!$user) {
            return;
        }

        $user->notifyNow(new ResetPassword($this->token));
    }

    public function tags(): array
    {
        return ['mail', 'email:password_reset', 'user:' . $this->userId];
    }
}
