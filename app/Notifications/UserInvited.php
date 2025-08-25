<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserInvited extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $username,
        private readonly string $tempPassword,
        private readonly string $resetUrl,
    ) {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Your new account at ' . config('app.name'))
            ->line('Your account has been created by the administrator of ' . config('app.name') . '.')
            ->line('**Username:** ' . $this->username)
            ->line('**Temporary Password:** ' . $this->tempPassword)
            ->line('For your security, please log in and change your password after your first login.')
            ->action('Change Password', $this->resetUrl);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
