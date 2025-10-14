<?php

namespace Database\Factories;

use App\Models\UserAddress;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Enum\AddressLabel;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserAddress>
 */
class UserAddressFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = UserAddress::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id'      => null, // Should be set explicitly when creating
            'label'        => fake()->randomElement(AddressLabel::values()),
            'address_line' => fake()->streetAddress(),
            'village'      => fake()->citySuffix(),
            'district'     => fake()->city(),
            'city'         => fake()->city(),
            'province'     => fake()->state(),
            'postal_code'  => fake()->postcode(),
        ];
    }
}
