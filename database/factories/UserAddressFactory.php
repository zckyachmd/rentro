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
            'label'        => $this->faker->randomElement(AddressLabel::values()),
            'address_line' => $this->faker->streetAddress(),
            'village'      => $this->faker->citySuffix(),
            'district'     => $this->faker->city(),
            'city'         => $this->faker->city(),
            'province'     => $this->faker->state(),
            'postal_code'  => $this->faker->postcode(),
        ];
    }
}
