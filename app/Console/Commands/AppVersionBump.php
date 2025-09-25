<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class AppVersionBump extends Command
{
    protected $signature = 'app:version
        {--bump : Shorthand to bump patch version}
        {--set= : Set explicit version (e.g. 1.2.3)}
        {--major : Bump major version}
        {--minor : Bump minor version}
        {--patch : Bump patch version (default)}
        {--example : Also update .env.example}
        {--no-clear : Do not clear cached config after update}';

    protected $description = 'Bump or set APP_VERSION in .env (and optionally .env.example).';

    public function handle(): int
    {
        $set     = (string) ($this->option('set') ?? '');
        $doBump  = (bool) $this->option('bump');
        $doMajor = (bool) $this->option('major');
        $doMinor = (bool) $this->option('minor');
        $doPatch = (bool) $this->option('patch');

        $current = (string) (config('app.version') ?? '0.0.0');

        $target = '';
        if ($set !== '') {
            if (!preg_match('/^\d+\.\d+\.\d+$/', $set)) {
                $this->error('Invalid --set value. Expected semantic version like 1.2.3');

                return self::INVALID;
            }
            // Guard: ensure set version is greater than current
            if ($this->compareSemver($set, $current) <= 0) {
                $this->error("Guard: --set target ({$set}) must be greater than current ({$current}). Use --bump to auto-increment.");

                return self::INVALID;
            }
            $target = $set;
        } else {
            [$maj, $min, $pat] = $this->parseSemver($current);
            if ($doMajor) {
                $maj += 1;
                $min = 0;
                $pat = 0;
            } elseif ($doMinor) {
                $min += 1;
                $pat = 0;
            } else { // default patch (also for --bump)
                // Always bump patch when not major/minor
                $pat += 1;
            }
            $target = sprintf('%d.%d.%d', $maj, $min, $pat);
        }

        $envPath = base_path('.env');
        $okEnv   = $this->writeEnvVersion($envPath, $target);
        if (!$okEnv) {
            $this->error('Failed to update .env');

            return self::FAILURE;
        }

        if ((bool) $this->option('example')) {
            $examplePath = base_path('.env.example');
            $okEx        = $this->writeEnvVersion($examplePath, $target, allowCreate: false);
            if (!$okEx) {
                $this->warn('Could not update .env.example (file missing or write failed).');
            }
        }

        if (!(bool) $this->option('no-clear')) {
            try {
                Artisan::call('config:clear');
            } catch (\Throwable) {
                // ignore
            }
        }

        // Post-guard: ensure target > previous
        if ($this->compareSemver($target, $current) <= 0) {
            $this->warn("Guard: computed target ({$target}) is not greater than current ({$current}).");

            return self::FAILURE;
        }

        $this->info("APP_VERSION updated to {$target}");

        return self::SUCCESS;
    }

    /**
     * @return array{0:int,1:int,2:int}
     */
    private function parseSemver(string $ver): array
    {
        if (!preg_match('/^(\d+)\.(\d+)\.(\d+)$/', trim($ver), $m)) {
            return [0, 0, 0];
        }

        return [max(0, (int) $m[1]), max(0, (int) $m[2]), max(0, (int) $m[3])];
    }

    /**
     * Compare two semantic versions. Returns -1, 0, 1.
     */
    private function compareSemver(string $a, string $b): int
    {
        [$a1, $a2, $a3] = $this->parseSemver($a);
        [$b1, $b2, $b3] = $this->parseSemver($b);

        return $a1 <=> $b1 ?: ($a2 <=> $b2 ?: ($a3 <=> $b3));
    }

    private function writeEnvVersion(string $path, string $version, bool $allowCreate = true): bool
    {
        try {
            $exists = is_file($path);
            if (!$exists && !$allowCreate) {
                return false;
            }
            $content = $exists ? (string) file_get_contents($path) : '';
            $lines   = preg_split("/\r?\n/", $content) ?: [];
            $found   = false;
            foreach ($lines as $i => $line) {
                if (preg_match('/^\s*APP_VERSION\s*=/', $line)) {
                    $lines[$i] = 'APP_VERSION=' . $version;
                    $found     = true;
                    break;
                }
            }
            if (!$found) {
                $lines[] = 'APP_VERSION=' . $version;
            }
            $out = rtrim(implode(PHP_EOL, $lines), "\r\n") . PHP_EOL;
            file_put_contents($path, $out);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
