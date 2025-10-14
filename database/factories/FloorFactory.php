<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\Floor;
use Illuminate\Database\Eloquent\Factories\Factory;

class FloorFactory extends Factory
{
    protected $model = Floor::class;

    public function definition(): array
    {
        return [
            'building_id' => Building::factory(),
            'level'       => fake()->numberBetween(1, 5),
            'name'        => null, // optional, bisa diisi "Lantai X" saat seeding
        ];
    }

    public function forBuilding(Building $building): self
    {
        return $this->state(fn () => ['building_id' => $building->id]);
    }

    public function level(int $level): self
    {
        return $this->state(fn () => ['level' => $level, 'name' => "Lantai {$level}"]);
    }
}
