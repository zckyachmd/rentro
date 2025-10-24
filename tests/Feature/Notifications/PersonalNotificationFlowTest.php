<?php

use App\Models\User;
use App\Services\NotificationService;

it('stores a database notification and increments unread count when notifying a user', function () {
    $user = User::factory()->create();

    $svc = app(NotificationService::class);
    $svc->notifyUser($user->id, 'Invoice Paid', 'Your invoice has been paid', '/invoices/1', ['k' => 'v']);

    $user->refresh();

    expect($user->notifications()->count())->toBe(1);
    $n = $user->notifications()->latest('created_at')->first();
    expect($n)->not->toBeNull();
    expect($n->data['title'] ?? null)->toBe('Invoice Paid');
    expect($user->unreadNotifications()->count())->toBe(1);
});

