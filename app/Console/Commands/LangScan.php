<?php

namespace App\Console\Commands;

use App\Enum\Locale as AppLocale;
use Illuminate\Console\Command;

class LangScan extends Command
{
    protected $signature = 'lang:scan
        {--path=app/Http : Code path to scan for translation keys}
        {--locale=* : Locale(s) to check, defaults to supported enums}
        {--strict : Fail with non-zero exit code when any missing key is found}';

    protected $description = 'Scan backend code for translation keys and report missing entries in lang files.';

    public function handle(): int
    {
        $path    = (string) $this->option('path');
        $locales = (array) $this->option('locale');
        if (empty($locales)) {
            $locales = array_map(fn (AppLocale $c) => $c->value, AppLocale::cases());
        }

        if (!is_dir(base_path($path))) {
            $this->error("Invalid --path: {$path}");

            return self::INVALID;
        }

        $keys = $this->collectKeys(base_path($path));
        if (empty($keys)) {
            $this->info('No translation keys found.');

            return self::SUCCESS;
        }

        $missing = [];
        foreach ($locales as $loc) {
            foreach ($keys as $key) {
                if (!$this->keyExists($loc, $key)) {
                    $missing[] = [$loc, $key];
                }
            }
        }

        if (empty($missing)) {
            $this->info('All referenced translation keys are present.');

            return self::SUCCESS;
        }

        $this->warn('Missing translation entries:');
        foreach ($missing as [$loc, $key]) {
            [$file, $arrayKey] = $this->resolveFileAndKey($key, $loc);
            $this->line("- [{$loc}] {$key}  (file: {$file}, key: {$arrayKey})");
        }

        return $this->option('strict') ? self::FAILURE : self::SUCCESS;
    }

    /**
     * @return array<int,string>
     */
    protected function collectKeys(string $dir): array
    {
        $keys = [];
        $it   = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
        /** @var \SplFileInfo $f */
        foreach ($it as $f) {
            if (!$f->isFile()) {
                continue;
            }
            $name = $f->getFilename();
            if (!str_ends_with($name, '.php')) {
                continue;
            }
            $content = (string) @file_get_contents($f->getPathname());
            if ($content === '') {
                continue;
            }
            // Match __('key') or __("key")
            if (preg_match_all("/__\(\s*['\"]([^'\"]+)['\"]\s*\)/", $content, $m)) {
                foreach ($m[1] as $k) {
                    $keys[$k] = true;
                }
            }
        }

        return array_keys($keys);
    }

    protected function keyExists(string $locale, string $key): bool
    {
        [$file, $arrayKey] = $this->resolveFileAndKey($key, $locale);
        if (!is_file($file)) {
            return false;
        }
        try {
            /** @var array<string,mixed> $arr */
            $arr = include $file;
        } catch (\Throwable) {
            return false;
        }
        if ($arrayKey === null || $arrayKey === '') {
            // Top-level file existence is enough
            return is_array($arr) && !empty($arr);
        }

        $segments = explode('.', $arrayKey);
        $ref      = $arr;
        foreach ($segments as $seg) {
            if (!is_array($ref) || !array_key_exists($seg, $ref)) {
                return false;
            }
            $ref = $ref[$seg];
        }

        return true;
    }

    /**
     * Resolve a lang PHP file path and array key from a translation key
     * Examples:
     *  - 'auth.failed' => file: lang/{loc}/auth.php, key: 'failed'
     *  - 'management/users.roles.updated' => file: lang/{loc}/management/users.php, key: 'roles.updated'
     *  - 'tenant/payment.va.created' => file: lang/{loc}/tenant/payment.php, key: 'va.created'.
     *
     * @return array{0:string,1:?string}
     */
    protected function resolveFileAndKey(string $key, string $locale): array
    {
        $dir      = base_path('lang/' . $locale);
        $pathPart = '';
        $tail     = $key;
        $pos      = strrpos($key, '/');
        if ($pos !== false) {
            $pathPart = substr($key, 0, $pos);
            $tail     = substr($key, $pos + 1);
        }
        $firstDot = strpos($tail, '.');
        $fileBase = $firstDot === false ? $tail : substr($tail, 0, $firstDot);
        $arrayKey = $firstDot === false ? null : substr($tail, $firstDot + 1);
        $file     = rtrim($dir . '/' . ($pathPart ? $pathPart . '/' : '') . $fileBase . '.php', '/');

        return [$file, $arrayKey];
    }
}
