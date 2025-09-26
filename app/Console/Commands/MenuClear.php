<?php

namespace App\Console\Commands;

use App\Enum\CacheKey;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class MenuClear extends Command
{
    protected $signature = 'menu:clear {userId? : User ID to clear (omit to show help)} {--guest : Also clear guest menu cache}';

    protected $description = 'Clear cached menu payload for a specific user (and optionally guest)';

    public function handle(): int
    {
        $userId = $this->argument('userId');
        $guest  = (bool) $this->option('guest');

        if ($userId === null) {
            $this->line('Usage: php artisan menu:clear {userId} [--guest]');
            $this->line('Examples:');
            $this->line('  php artisan menu:clear 42');
            $this->line('  php artisan menu:clear 42 --guest');

            return self::SUCCESS;
        }

        $uid = null;
        if (is_numeric($userId)) {
            $uid = (int) $userId;
        } else {
            $this->error('Invalid userId. Must be numeric.');

            return self::INVALID;
        }

        try {
            $key = CacheKey::MenuForUser->forUser($uid);
            Cache::forget($key);
            $this->info("Cleared menu cache for user {$uid} (key={$key})");
        } catch (\Throwable $e) {
            $this->error('Failed to clear user cache: ' . $e->getMessage());

            return self::FAILURE;
        }

        if ($guest) {
            try {
                $gk = CacheKey::MenuForUser->forUser(null);
                Cache::forget($gk);
                $this->info("Cleared menu cache for guest (key={$gk})");
            } catch (\Throwable $e) {
                $this->warn('Failed to clear guest cache: ' . $e->getMessage());
            }
        }

        return self::SUCCESS;
    }
}
