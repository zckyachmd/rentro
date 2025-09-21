<?php

namespace App\Jobs;

use App\Models\User;
use App\Notifications\UserInvited;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendUserInvitationEmail implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public int $userId,
        public string $username,
        public string $tempPassword,
        public string $resetUrl,
    ) {
        $this->onQueue('mail');
    }

    public function handle(): void
    {
        $user = User::query()->find($this->userId);
        if (!$user) {
            return;
        }

        $user->notifyNow(new UserInvited($this->username, $this->tempPassword, $this->resetUrl, $this->userId));
    }

    public function tags(): array
    {
        return ['mail', 'email:invitation', 'user:' . $this->userId];
    }
}
