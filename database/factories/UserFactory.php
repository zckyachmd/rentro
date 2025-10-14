<?php

namespace Database\Factories;

use App\Enum\Gender;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\Factories\Factory;

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
            'name'              => $this->faker->name(),
            'username'          => Str::lower($this->faker->unique()->userName()),
            'email'             => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'remember_token'    => Str::random(10),
            'phone'             => $this->faker->phoneNumber(),
            'avatar_path'       => null,
            'gender'            => $this->faker->randomElement(Gender::values()),
            'dob'               => $this->faker->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'preferences'       => json_encode([
                'notifications' => [
                    'email' => true,
                    'sms'   => $this->faker->boolean(),
                ],
                'theme' => $this->faker->randomElement(['light', 'dark']),
            ]),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes): array => [
            'email_verified_at' => null,
        ]);
    }
}
