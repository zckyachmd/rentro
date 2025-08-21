<?php

namespace Database\Factories;

use App\Models\EmergencyContact;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EmergencyContact>
 */
class EmergencyContactFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = EmergencyContact::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id'      => null, // Should be set explicitly when creating
            'name'         => fake()->name(),
            'relationship' => fake()->randomElement(['parent', 'sibling', 'friend', 'spouse', 'partner']),
            'phone'        => fake()->phoneNumber(),
            'email'        => fake()->optional()->safeEmail(),
            'address_line' => fake()->optional()->streetAddress(),
        ];
    }
}
