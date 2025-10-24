<?php

use App\Events\GlobalAnnouncementBroadcast;
use App\Events\RoleAnnouncementBroadcast;

it('includes persist flag in role broadcast payload when set', function () {
    $ev = new RoleAnnouncementBroadcast([
        'role_id' => 1,
        'title' => 'Hello',
        'message' => 'Role message',
        'action_url' => null,
        'persist' => true,
    ]);

    $payload = $ev->broadcastWith();
    expect($payload)->toHaveKey('persist');
    expect($payload['persist'])->toBeTrue();
});

it('includes persist flag in global broadcast payload when set', function () {
    $ev = new GlobalAnnouncementBroadcast([
        'title' => 'Global',
        'message' => 'Message',
        'action_url' => null,
        'persist' => true,
    ]);

    $payload = $ev->broadcastWith();
    expect($payload)->toHaveKey('persist');
    expect($payload['persist'])->toBeTrue();
});

