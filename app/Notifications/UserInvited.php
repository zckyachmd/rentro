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
        private readonly ?int $userId = null,
    ) {
        $this->onQueue('mail');
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

    /**
     * Horizon tags for queued notification (when used directly as queued notification).
     * Accept optional context argument for compatibility with Horizon tag resolution.
     *
     * @param mixed $context
     * @return array<int, string>
     */
    public function tags($context = null): array
    {
        $uid = $this->userId;
        if (!$uid && is_object($context)) {
            if (method_exists($context, 'getAttribute')) {
                $val = $context->getAttribute('id');
                $uid = is_numeric($val) ? (int) $val : null;
            } elseif (property_exists($context, 'id')) {
                $val = $context->id;
                $uid = is_numeric($val) ? (int) $val : null;
            }
        }

        return array_values(array_filter([
            'mail',
            'notify:user_invited',
            $uid ? ('user:' . (string) $uid) : null,
        ]));
    }

    /**
     * Map notification channels to specific queues (for Horizon separation).
     *
     * @return array<string, string>
     */
    public function viaQueues(): array
    {
        return [
            'mail' => 'mail',
        ];
    }
}
