<?php

namespace App\Listeners;

use Illuminate\Console\Events\CommandFinished;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Log;

class RealtimeEventSubscriber
{
    public function onCommandStarting(CommandStarting $event): void
    {
        if (($event->command ?? '') === 'reverb:start') {
            Log::info('Reverb server starting');
        }
    }

    public function onCommandFinished(CommandFinished $event): void
    {
        if (($event->command ?? '') === 'reverb:start') {
            Log::info('Reverb server stopped', [
                'exitCode' => $event->exitCode,
            ]);
        }
    }

    public function onNotificationSent(NotificationSent $event): void
    {
        if ($event->channel !== 'broadcast') {
            return;
        }

        // Silence in production unless explicitly enabled
        if (!config('notifications.log_broadcasts', false)) {
            return;
        }

        $userId = null;
        try {
            /** @var mixed $n */
            $n      = $event->notifiable;
            $userId = is_object($n) ? ($n->id ?? null) : null;
        } catch (\Throwable) {
        }

        Log::debug('Notification broadcast sent', [
            'channel' => $event->channel,
            'type'    => class_basename($event->notification),
            'user_id' => $userId,
            'uuid'    => $event->notification->id,
        ]);
    }

    /**
     * Register the listeners for the subscriber.
     * @return array<class-string, string>
     */
    public function subscribe(): array
    {
        return [
            CommandStarting::class  => 'onCommandStarting',
            CommandFinished::class  => 'onCommandFinished',
            NotificationSent::class => 'onNotificationSent',
        ];
    }
}
