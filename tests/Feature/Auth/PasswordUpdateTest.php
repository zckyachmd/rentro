<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('password can be updated', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->put('/password', [
            'current_password'      => 'password',
            'password'              => 'New-Password1!',
            'password_confirmation' => 'New-Password1!',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertTrue(Hash::check('New-Password1!', $user->refresh()->password));
});

test('correct password must be provided to update password', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->put('/password', [
            'current_password'      => 'wrong-password',
            'password'              => 'New-Password1!',
            'password_confirmation' => 'New-Password1!',
        ]);

    $response
        ->assertSessionHasErrors('current_password')
        ->assertRedirect('/profile');
});
