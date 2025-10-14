<?php

namespace Database\Factories;

use App\Models\Building;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BuildingFactory extends Factory
{
    protected $model = Building::class;

    public function definition(): array
    {
        $name = 'Gedung ' . Str::upper(fake()->bothify('??-###'));

        $code = $this->makeUniqueBuildingCode();

        return [
            'name'      => $name,
            'code'      => $code,
            'address'   => fake()->address(),
            'is_active' => true,
        ];
    }

    protected function makeUniqueBuildingCode(): string
    {
        static $used = [];

        do {
            $candidate = 'B' . Str::upper(Str::random(6));
        } while (isset($used[$candidate]) || \App\Models\Building::where('code', $candidate)->exists());

        $used[$candidate] = true;

        return $candidate;
    }
}
