<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('profile page is displayed', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('profile information can be updated', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name'     => 'Test User',
            'username' => 'validuser',
            'email'    => 'test@example.com',
            'phone'    => $user->phone ?? '081234567890',
            'gender'   => 'male',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile/edit');

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name'     => 'Test User',
            'username' => 'validuser',
            'email'    => $user->email,
            'phone'    => $user->phone ?? '081234567890',
            'gender'   => 'male',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile/edit');

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    expect($user->fresh())->not->toBeNull();
});
