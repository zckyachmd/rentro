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
        $status = fake()->randomElement(TestimonyStatus::cases());
        $publishedAt = $status === TestimonyStatus::PUBLISHED
            ? fake()->dateTimeBetween('-2 years', 'now')
            : null;
        $isAnon = fake()->boolean(20); // ~20% anonymous
        $occupations = ['Mahasiswa', 'Karyawan', 'Freelancer', 'Perawat', 'Desainer', 'Programmer', 'Akuntan', 'Content Creator'];
        $occupation = fake()->boolean(70) ? fake()->randomElement($occupations) : null;

        return [
            'id'               => null, // filled by HasSnowflakeId
            'user_id'          => User::factory(),
            'content_original' => fake()->sentences(rand(2, 5), true),
            'content_curated'  => fake()->boolean(50) ? fake()->sentences(rand(2, 4), true) : null,
            'status'           => $status,
            'is_anonymous'     => $isAnon,
            'occupation'       => $occupation,
            'curated_by'       => null,
            'curated_at'       => null,
            'published_at'     => $publishedAt,
        ];
    }
}
