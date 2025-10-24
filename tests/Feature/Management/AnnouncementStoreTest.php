<?php

use App\Jobs\SendAnnouncement;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Spatie\Permission\Models\Role;

it('creates and queues immediate global announcement', function () {
    Bus::fake();
    $managerRole = Role::firstOrCreate(['name' => 'Manager']);
    $user = User::factory()->create();
    $user->assignRole('Manager');

    $res = $this->actingAs($user)->post(route('management.announcements.store'), [
        'target' => 'global',
        'title' => 'Hello',
        'message' => 'World',
        'persist' => false,
    ]);
    $res->assertRedirect();

    $a = Announcement::query()->latest('id')->first();
    expect($a)->not->toBeNull();
    expect($a->scope)->toBe('global');
    expect($a->status)->toBe('queued');

    Bus::assertDispatched(SendAnnouncement::class);
});

it('creates scheduled role announcement', function () {
    Bus::fake();
    $role = Role::firstOrCreate(['name' => 'Manager']);
    $user = User::factory()->create();
    $user->assignRole('Manager');

    $future = now()->addHour()->format('Y-m-d\TH:i');

    $res = $this->actingAs($user)->post(route('management.announcements.store'), [
        'target' => 'role',
        'role_id' => $role->id,
        'title' => 'Hi',
        'message' => 'There',
        'persist' => true,
        'scheduled_at' => $future,
    ]);
    $res->assertRedirect();

    $a = Announcement::query()->latest('id')->first();
    expect($a)->not->toBeNull();
    expect($a->scope)->toBe('role');
    expect($a->status)->toBe('scheduled');

    Bus::assertDispatched(SendAnnouncement::class);
});

