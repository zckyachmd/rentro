<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendVerificationEmail implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $userId)
    {
        $this->onQueue('mail');
    }

    public function handle(): void
    {
        $user = User::query()->find($this->userId);
        if (!$user) {
            return;
        }

        if (method_exists($user, 'hasVerifiedEmail') && $user->hasVerifiedEmail()) {
            return;
        }

        $user->notifyNow(new VerifyEmail());
    }

    public function tags(): array
    {
        return ['mail', 'email:verification', 'user:' . $this->userId];
    }
}
