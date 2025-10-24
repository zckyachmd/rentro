<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('password can be updated', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/security/password')
        ->patch('/security/password', [
            'current_password'      => 'password',
            'password'              => 'New-Password1!',
            'password_confirmation' => 'New-Password1!',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/security/password');

    expect(Hash::check('New-Password1!', $user->refresh()->password))->toBeTrue();
});

test('correct password must be provided to update password', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/security/password')
        ->patch('/security/password', [
            'current_password'      => 'wrong-password',
            'password'              => 'New-Password1!',
            'password_confirmation' => 'New-Password1!',
        ]);

    $response
        ->assertSessionHasErrors('current_password')
        ->assertRedirect('/security/password');
});
