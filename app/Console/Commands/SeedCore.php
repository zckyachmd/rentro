<?php

namespace App\Console\Commands;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\Command;
use Illuminate\Console\ConfirmableTrait;

class SeedCore extends Command
{
    use ConfirmableTrait;

    protected $signature = 'seed:core {--force : Run without confirmation prompt}';

    protected $description = 'Seed production-safe core data (settings, permissions, menus, base refs, admin)';

    public function handle(): int
    {
        if (!$this->confirmToProceed('Seed core data?', fn () => true)) {
            return self::INVALID;
        }

        $this->info('Seeding core data...');
        $this->call('db:seed', [
            '--class' => DatabaseSeeder::class,
            '--force' => true,
        ]);
        $this->info('Core data seeded.');

        return self::SUCCESS;
    }
}
