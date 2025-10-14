<?php

namespace Database\Factories;

use App\Models\EmergencyContact;
use App\Enum\EmergencyRelationship;
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
            'name'         => $this->faker->name(),
            'relationship' => $this->faker->randomElement(EmergencyRelationship::values()),
            'phone'        => $this->faker->phoneNumber(),
            'email'        => $this->faker->optional()->safeEmail(),
            'address_line' => $this->faker->optional()->streetAddress(),
        ];
    }
}
