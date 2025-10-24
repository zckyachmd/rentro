<?php

use App\Events\GlobalAnnouncementBroadcast;
use App\Events\RoleAnnouncementBroadcast;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

it('broadcasts role announcement when persist=false', function () {
    Event::fake();
    $role = Role::create(['name' => 'Staff']);

    app(NotificationService::class)->announceRole($role->id, 'Hi', 'Role message', null, false);

    Event::assertDispatched(RoleAnnouncementBroadcast::class);
});

it('broadcasts global announcement when persist=false', function () {
    Event::fake();
    app(NotificationService::class)->announceGlobal('Hello', 'World', null, false);
    Event::assertDispatched(GlobalAnnouncementBroadcast::class);
});

