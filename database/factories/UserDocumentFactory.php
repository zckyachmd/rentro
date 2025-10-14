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
        $type = $this->faker->randomElement(DocumentType::cases())->value;

        $number = match ($type) {
            DocumentType::KTP->value      => $this->faker->numerify(str_repeat('#', 16)),
            DocumentType::NPWP->value     => $this->faker->numerify('##.###.###.#-###.###'),
            DocumentType::SIM->value,
            DocumentType::PASSPORT->value => $this->faker->bothify('??######'),
            // Ensure non-null for OTHER to satisfy NOT NULL constraint
            DocumentType::OTHER->value    => $this->faker->bothify('DOC-########'),
        };

        $issuedAt  = $this->faker->date();
        $expiresAt = in_array($type, [DocumentType::SIM->value, DocumentType::PASSPORT->value, DocumentType::OTHER->value])
            ? $this->faker->dateTimeBetween('+1 year', '+10 years')->format('Y-m-d')
            : null;

        return [
            'user_id'     => null, // set explicitly when creating
            'type'        => $type,
            'number'      => $number,
            'attachments' => [],
            'issued_at'   => $issuedAt,
            'expires_at'  => $expiresAt,
            'status'      => $this->faker->randomElement(DocumentStatus::values()),
            'verified_at' => null,
            'notes'       => null,
        ];
    }
}
