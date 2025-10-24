<?php

use App\Notifications\PersonalNotification;
use App\Models\User;

it('marks a single notification as read', function () {
    $u = User::factory()->create();
    $u->notify(new PersonalNotification([
        'title' => 'Test',
        'message' => 'Hello',
    ]));

    $n = $u->notifications()->latest()->first();
    expect($n)->not->toBeNull();
    expect($n->read_at)->toBeNull();

    $res = $this->actingAs($u)->put(route('notifications.read', ['id' => $n->id]));
    $res->assertRedirect();

    $n->refresh();
    expect($n->read_at)->not->toBeNull();
});

it('marks all notifications as read', function () {
    $u = User::factory()->create();
    $u->notify(new PersonalNotification(['title' => 'A', 'message' => 'a']));
    $u->notify(new PersonalNotification(['title' => 'B', 'message' => 'b']));
    $u->notify(new PersonalNotification(['title' => 'C', 'message' => 'c']));

    expect($u->unreadNotifications()->count())->toBeGreaterThan(0);

    $res = $this->actingAs($u)->put(route('notifications.read_all'));
    $res->assertRedirect();

    expect($u->fresh()->unreadNotifications()->count())->toBe(0);
});

