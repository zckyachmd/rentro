<?php

use App\Events\AnnouncementCreatedBroadcast;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

it('dispatches created broadcast event when storing an announcement', function () {
    Event::fake();
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

    Event::assertDispatched(AnnouncementCreatedBroadcast::class);
});

