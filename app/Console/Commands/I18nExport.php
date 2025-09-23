<?php

namespace App\Console\Commands;

use App\Enum\Locale as AppLocale;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class I18nExport extends Command
{
    protected $signature = 'i18n:export {--mode=aggregate} {--prefer=backend} {--clean}';

    protected $description = 'Export PHP lang catalogs to FE JSON catalogs';

    public function handle(): int
    {
        $mode   = $this->normalizeOption('mode', ['aggregate', 'split'], 'aggregate');
        $prefer = $this->normalizeOption('prefer', ['backend', 'frontend'], 'backend');
        $clean  = (bool) $this->option('clean');

        $supported = array_map(fn (AppLocale $c) => $c->value, AppLocale::cases());
        $srcRoot   = base_path('lang');
        $dstRoot   = base_path('resources/js/locales');

        if (!File::exists($dstRoot)) {
            File::makeDirectory($dstRoot, 0755, true);
        }

        foreach ($supported as $locale) {
            $this->processLocale($locale, $srcRoot, $dstRoot, $mode, $prefer, $clean);
        }

        return self::SUCCESS;
    }

    /**
     * Normalize and validate an option value.
     */
    private function normalizeOption(string $name, array $allowed, string $fallback): string
    {
        $value = strtolower((string) ($this->option($name) ?: $fallback));
        if (!in_array($value, $allowed, true)) {
            $this->warn("Unknown --{$name}='{$value}', fallback to '{$fallback}'. Allowed: " . implode(', ', $allowed));
            $value = $fallback;
        }

        return $value;
    }

    private function processLocale(string $locale, string $srcRoot, string $dstRoot, string $mode, string $prefer, bool $clean): void
    {
        $srcDir = $srcRoot . DIRECTORY_SEPARATOR . $locale;
        if (!File::isDirectory($srcDir)) {
            $this->warn("Skip {$locale}: source dir not found: {$srcDir}");

            return;
        }

        $dstDir = $dstRoot . DIRECTORY_SEPARATOR . $locale;
        if ($clean && File::isDirectory($dstDir)) {
            File::deleteDirectory($dstDir);
        }
        if (!File::exists($dstDir)) {
            File::makeDirectory($dstDir, 0755, true);
        }

        // Local helpers (scoped to this locale only)
        $replacePlaceholders = static function ($value) {
            return is_string($value) ? preg_replace('/:([A-Za-z0-9_]+)/', '{{$1}}', $value) : $value;
        };
        $flatten = static function (array $arr, string $prefix = '') use (&$flatten, $replacePlaceholders): array {
            $out = [];
            foreach ($arr as $k => $v) {
                $key = $prefix === '' ? (string) $k : ($prefix . '.' . $k);
                if (is_array($v)) {
                    $out += $flatten($v, $key);
                } else {
                    $out[$key] = $replacePlaceholders($v);
                }
            }

            return $out;
        };
        $readJson = static function (string $path): array {
            if (!File::exists($path)) {
                return [];
            }
            $json = json_decode(File::get($path), true);

            return is_array($json) ? $json : [];
        };
        $writeJson = function (string $path, array $data): void {
            ksort($data);
            File::put($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n");
            $this->info("Wrote {$path}");
        };

        // Load groups (PHP arrays) and prefix keys with group path
        $groups = [];
        foreach (File::allFiles($srcDir) as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }
            $relativePath = str_replace(DIRECTORY_SEPARATOR, '/', trim(str_replace($srcDir, '', $file->getPathname()), DIRECTORY_SEPARATOR));
            $groupPath    = preg_replace('/\.php$/', '', $relativePath);
            try {
                /** @noinspection PhpIncludeInspection */
                $data = include $file->getPathname();
                if (!is_array($data)) {
                    continue;
                }
                $flat     = $flatten($data);
                $prefixed = [];
                foreach ($flat as $k => $v) {
                    $prefixed[$groupPath . '.' . $k] = $v;
                }
                $groups[$groupPath] = $prefixed;
            } catch (\Throwable $e) {
                $this->error("Failed loading {$relativePath}: {$e->getMessage()}");
            }
        }

        // Write outputs
        if ($mode === 'split') {
            foreach ($groups as $group => $kv) {
                $basename = basename($group);
                $dst      = $dstDir . DIRECTORY_SEPARATOR . $basename . '.json';
                $existing = $readJson($dst);
                $merged   = $prefer === 'frontend' ? array_merge($kv, $existing) : array_merge($existing, $kv);
                $writeJson($dst, $merged);
            }
        } else {
            $aggregate = [];
            foreach ($groups as $kv) {
                $aggregate = array_merge($aggregate, $kv);
            }
            $dst      = $dstDir . DIRECTORY_SEPARATOR . 'common.json';
            $existing = $readJson($dst);
            $merged   = $prefer === 'frontend' ? array_merge($aggregate, $existing) : array_merge($existing, $aggregate);
            $writeJson($dst, $merged);
        }
    }
}
