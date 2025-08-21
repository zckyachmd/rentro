<?php

namespace Database\Factories;

use App\Models\UserDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserDocument>
 */
class UserDocumentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = UserDocument::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(['KTP', 'SIM', 'PASSPORT', 'NPWP', 'other']);

        // Generate realistic document number formats
        $number = match ($type) {
            'KTP'  => fake()->numerify(str_repeat('#', 16)), // 16-digit NIK
            'NPWP' => fake()->numerify('##.###.###.#-###.###'), // NPWP-like format
            'SIM', 'PASSPORT' => fake()->bothify('??######'),
            'other' => null,
        };

        $issuedAt  = fake()->date();
        $expiresAt = in_array($type, ['SIM', 'PASSPORT', 'other']) ? fake()->dateTimeBetween('+1 year', '+10 years')->format('Y-m-d') : null;

        return [
            'user_id'     => null, // set explicitly when creating
            'type'        => $type,
            'number'      => $number,
            'file_path'   => 'documents/' . fake()->uuid() . '.jpg',
            'issued_at'   => $issuedAt,
            'expires_at'  => $expiresAt,
            'status'      => fake()->randomElement(['pending', 'approved', 'rejected']),
            'verified_by' => null,
            'verified_at' => null,
            'notes'       => null,
        ];
    }
}
