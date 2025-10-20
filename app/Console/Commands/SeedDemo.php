<?php

namespace App\Console\Commands;

use App\Enum\RoleName;
use App\Models\User;
use Database\Factories\EmergencyContactFactory;
use Database\Factories\UserAddressFactory;
use Database\Factories\UserDocumentFactory;
use Database\Seeders\DemoDataSeeder;
use Illuminate\Console\Command;
use Illuminate\Console\ConfirmableTrait;

class SeedDemo extends Command
{
    use ConfirmableTrait;

    protected $signature = 'seed:demo {--tenants=30 : Number of demo tenants to create (with addresses, document, emergency contacts)} {--force : Run without confirmation prompt}';

    protected $description = 'Seed demo data (faker users, rooms, promotions, testimonies)';

    public function handle(): int
    {
        if (!$this->confirmToProceed('Seed sample (faker) data?', fn () => !app()->isProduction())) {
            return self::INVALID;
        }

        $this->warn('This command creates demo/sample data. Do not run in production.');

        $count = (int) $this->option('tenants');
        if ($count > 0) {
            $this->info("Creating {$count} demo tenant users with related data...");
            User::factory()
                ->count($count)
                ->has(UserAddressFactory::new()->count(1), 'addresses')
                ->has(UserDocumentFactory::new(), 'document')
                ->has(EmergencyContactFactory::new()->count(2), 'emergencyContacts')
                ->create()
                ->each->assignRole(RoleName::TENANT->value);
        }

        $this->call('db:seed', [
            '--class' => DemoDataSeeder::class,
            '--force' => true,
        ]);
        $this->info('Sample data seeded.');

        return self::SUCCESS;
    }
}
