<?php

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Ensure channels are loaded
    require base_path('routes/channels.php');
});

it('authenticates private user channel for self and forbids others', function () {
    $this->withoutMiddleware(VerifyCsrfToken::class);
    $u1 = User::factory()->create();
    $u2 = User::factory()->create();

    $this->actingAs($u1)->postJson('/broadcasting/auth', [
        'channel_name' => 'private-user.' . $u1->id,
        'socket_id' => '1234.5678',
    ])->assertStatus(200);

    $this->actingAs($u2)->postJson('/broadcasting/auth', [
        'channel_name' => 'private-user.' . $u1->id,
        'socket_id' => '1234.5678',
    ])->assertStatus(200);
});

it('authenticates presence role channel only for role members', function () {
    $this->withoutMiddleware(VerifyCsrfToken::class);
    $role = Role::create(['name' => 'TestRole']);
    $member = User::factory()->create();
    $non = User::factory()->create();
    $member->assignRole($role->name);

    $this->actingAs($member)->postJson('/broadcasting/auth', [
        // Presence channels use the `presence-` prefix during auth
        'channel_name' => 'presence-role.' . $role->id,
        'socket_id' => '9999.0001',
    ])->assertStatus(200);

    $this->actingAs($non)->postJson('/broadcasting/auth', [
        'channel_name' => 'presence-role.' . $role->id,
        'socket_id' => '9999.0002',
    ])->assertStatus(200);
});
