<?php

namespace Database\Factories;

use App\Models\RoomType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RoomTypeFactory extends Factory
{
    protected $model = RoomType::class;

    public function definition(): array
    {
        $name = $this->faker->randomElement(['Standard', 'Deluxe', 'Suite', 'Economy']);

        return [
            'name'            => $name,
            'slug'            => Str::slug($name) . '-' . Str::random(4),
            'capacity'        => $this->faker->randomElement([1, 1, 2]), // bias ke 1
            'size_m2'         => $this->faker->randomFloat(2, 8, 20),
            'shared_bathroom' => $this->faker->boolean(20),
            'description'     => $this->faker->sentence(8),
            'is_active'       => true,
        ];
    }
}
