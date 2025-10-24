<?php

use App\Jobs\SendUserNotification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;
use App\Events\RoleAnnouncementBroadcast;
use App\Events\GlobalAnnouncementBroadcast;

it('announceRole with persist=true broadcasts immediately and batches per-user jobs', function () {
    Bus::fake();
    Event::fake();

    $role = Role::firstOrCreate(['name' => 'Staff']);
    $u1 = User::factory()->create();
    $u2 = User::factory()->create();
    $u1->assignRole('Staff');
    $u2->assignRole('Staff');

    app(NotificationService::class)->announceRole($role->id, 'Meeting', 'Today 4PM', null, true);

    Event::assertDispatched(RoleAnnouncementBroadcast::class);
    Bus::assertBatched(function ($batch) use ($u1, $u2) {
        if ($batch->name !== 'role-notifications-' . $u1->roles->first()->id) {
            return false;
        }
        $jobs = collect($batch->jobs ?? []);
        $targets = $jobs->filter(fn ($j) => $j instanceof SendUserNotification)->map->userId->all();
        sort($targets);
        return $targets === [min($u1->id, $u2->id), max($u1->id, $u2->id)];
    });
});

it('announceGlobal with persist=true broadcasts immediately and batches per-user jobs', function () {
    Bus::fake();
    Event::fake();

    // Create a few users
    $users = User::factory()->count(3)->create();

    app(NotificationService::class)->announceGlobal('Maintenance', 'Tonight 1AM', null, true);

    Event::assertDispatched(GlobalAnnouncementBroadcast::class);
    Bus::assertBatched(function ($batch) use ($users) {
        if ($batch->name !== 'global-notifications') {
            return false;
        }
        $jobs = collect($batch->jobs ?? []);
        $targets = $jobs->filter(fn ($j) => $j instanceof SendUserNotification)->map->userId->sort()->values()->all();
        $expected = $users->pluck('id')->sort()->values()->all();
        return $targets === $expected;
    });
});

