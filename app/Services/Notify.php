<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\RealtimeAppNotification;
use Illuminate\Support\Facades\Notification;

class Notify
{
    /**
     * Send a realtime app notification to a specific user (DB + broadcast).
     */
    public function toUser(User $user, string $title, string $message, ?string $url = null): void
    {
        Notification::send($user, new RealtimeAppNotification($title, $message, $url));
    }
}
