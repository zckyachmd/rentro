<?php

test('registration screen can be rendered', function (): void {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register', function (): void {
    $response = $this->post('/register', [
        'name'                  => 'Test User',
        'username'              => 'testuser',
        'email'                 => 'test@example.com',
        'password'              => 'New-Password1!',
        'password_confirmation' => 'New-Password1!',
    ]);

    $response->assertRedirect(route('login', absolute: false));
});
