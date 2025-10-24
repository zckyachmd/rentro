<?php

use App\Jobs\SendAnnouncement;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Spatie\Permission\Models\Role;

it('allows send-now on scheduled announcement', function () {
    Bus::fake();
    $role = Role::firstOrCreate(['name' => 'Manager']);
    $user = User::factory()->create();
    $user->assignRole('Manager');

    $a = Announcement::create([
        'scope' => 'global',
        'title' => 'Sched',
        'message' => 'Later',
        'persist' => false,
        'status' => 'scheduled',
        'scheduled_at' => now()->addHour(),
        'created_by' => $user->id,
    ]);

    $res = $this->actingAs($user)->post(route('management.announcements.send_now', ['announcement' => $a->id]));
    $res->assertRedirect();

    $a->refresh();
    expect($a->status)->toBe('queued');
    expect($a->scheduled_at)->toBeNull();
    Bus::assertDispatched(SendAnnouncement::class);
});

