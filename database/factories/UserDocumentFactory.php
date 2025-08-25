<?php

namespace Database\Factories;

use App\Enum\DocumentType;
use App\Enum\DocumentStatus;
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
        $type = fake()->randomElement(DocumentType::cases())->value;

        $number = match ($type) {
            DocumentType::KTP->value      => fake()->numerify(str_repeat('#', 16)),
            DocumentType::NPWP->value     => fake()->numerify('##.###.###.#-###.###'),
            DocumentType::SIM->value,
            DocumentType::PASSPORT->value => fake()->bothify('??######'),
            DocumentType::OTHER->value    => null,
        };

        $issuedAt  = fake()->date();
        $expiresAt = in_array($type, [DocumentType::SIM->value, DocumentType::PASSPORT->value, DocumentType::OTHER->value])
            ? fake()->dateTimeBetween('+1 year', '+10 years')->format('Y-m-d')
            : null;

        return [
            'user_id'     => null, // set explicitly when creating
            'type'        => $type,
            'number'      => $number,
            'file_path'   => 'documents/' . fake()->uuid() . '.jpg',
            'issued_at'   => $issuedAt,
            'expires_at'  => $expiresAt,
            'status'      => fake()->randomElement(DocumentStatus::values()),
            'verified_by' => null,
            'verified_at' => null,
            'notes'       => null,
        ];
    }
}
