<?php

namespace Database\Factories;

use App\Enum\TestimonyStatus;
use App\Models\Testimony;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Testimony>
 */
class TestimonyFactory extends Factory
{
    protected $model = Testimony::class;

    public function definition(): array
    {
        $status = $this->faker->randomElement(TestimonyStatus::cases());
        $publishedAt = $status === TestimonyStatus::PUBLISHED
            ? $this->faker->dateTimeBetween('-2 years', 'now')
            : null;
        $isAnon = $this->faker->boolean(20); // ~20% anonymous
        $occupations = ['Mahasiswa', 'Karyawan', 'Freelancer', 'Perawat', 'Desainer', 'Programmer', 'Akuntan', 'Content Creator'];
        $occupation = $this->faker->boolean(70) ? $this->faker->randomElement($occupations) : null;

        return [
            'id'               => null, // filled by HasSnowflakeId
            'user_id'          => User::factory(),
            'content_original' => $this->faker->sentences(rand(2, 5), true),
            'content_curated'  => $this->faker->boolean(50) ? $this->faker->sentences(rand(2, 4), true) : null,
            'status'           => $status,
            'is_anonymous'     => $isAnon,
            'occupation'       => $occupation,
            'curated_by'       => null,
            'curated_at'       => null,
            'published_at'     => $publishedAt,
        ];
    }
}
