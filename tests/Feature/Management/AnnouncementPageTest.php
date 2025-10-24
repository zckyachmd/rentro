<?php

use App\Enum\RoleName;
use App\Models\User;
use Spatie\Permission\Models\Role;

it('redirects guests from announcements page', function () {
    $res = $this->get('/management/announcements');
    $res->assertRedirect('/login');
});

it('allows managers to view announcements page', function () {
    $role = Role::firstOrCreate(['name' => RoleName::MANAGER->value]);
    $user = User::factory()->create();
    $user->assignRole($role->name);

    $res = $this->actingAs($user)->get('/management/announcements');
    $res->assertOk();
});

