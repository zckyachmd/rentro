<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password = null;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'              => fake()->name(),
            'username'          => Str::lower(fake()->unique()->userName()),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'remember_token'    => Str::random(10),
            'phone'             => fake()->phoneNumber(),
            'avatar_path'       => null,
            'gender'            => fake()->randomElement(['male', 'female']),
            'dob'               => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'preferences'       => json_encode([
                'notifications' => [
                    'email' => true,
                    'sms'   => fake()->boolean(),
                ],
                'theme' => fake()->randomElement(['light', 'dark']),
            ]),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes): array => [
            'email_verified_at' => null,
        ]);
    }
}
