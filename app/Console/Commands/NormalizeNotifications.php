<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Notifications\DatabaseNotification;

class NormalizeNotifications extends Command
{
    protected $signature = 'notifications:normalize
        {--dry-run : Only show what would change}
        {--chunk=1000 : Chunk size when scanning}
        {--limit=0 : Max records to update (0 = no limit)}';

    protected $description = 'Normalize stored notification payloads so title/message use translation key objects or decoded JSON.';

    public function handle(): int
    {
        $dryRun  = (bool) $this->option('dry-run');
        $chunk   = max(10, (int) $this->option('chunk'));
        $limit   = max(0, (int) $this->option('limit'));
        $updated = 0;
        $scanned = 0;
        $startTs = microtime(true);

        $this->info(($dryRun ? '[dry-run] ' : '') . 'Scanning notifications table...');

        try {
            DatabaseNotification::query()
                ->orderBy('id')
                ->select(['id', 'type', 'data'])
                ->chunkById($chunk, function ($rows) use (&$updated, &$scanned, $dryRun, $limit) {
                    foreach ($rows as $n) {
                        /* @var DatabaseNotification $n */
                        $scanned++;
                        $data  = (array) ($n->data ?? []);
                        $dirty = false;

                        foreach (['title', 'message'] as $field) {
                            if (!array_key_exists($field, $data)) {
                                continue;
                            }
                            $val = $data[$field];
                            // Decode if JSON string object
                            if (is_string($val)) {
                                $trim    = trim($val);
                                $decoded = null;
                                if (str_starts_with($trim, '{') && str_ends_with($trim, '}')) {
                                    try {
                                        $decoded = json_decode($trim, true, 512, JSON_THROW_ON_ERROR);
                                    } catch (\Throwable) {
                                        $decoded = null;
                                    }
                                }
                                if (is_array($decoded)) {
                                    $data[$field] = $decoded;
                                    $dirty        = true;
                                    continue;
                                }
                                // Wrap obvious translation keys (notifications.*) into { key: ... }
                                if (preg_match('/^notifications\./', $trim) === 1) {
                                    $data[$field] = ['key' => $trim];
                                    $dirty        = true;
                                }
                            }
                        }

                        if ($dirty) {
                            if ($dryRun) {
                                $this->line("- would update #{$n->id} ({$n->type})");
                            } else {
                                $n->data = $data;
                                $n->save();
                            }
                            $updated++;
                            if ($limit > 0 && $updated >= $limit) {
                                // Stop early by throwing an exception to break chunk loop cleanly
                                throw new \RuntimeException('limit-reached');
                            }
                        }
                    }
                });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() !== 'limit-reached') {
                throw $e;
            }
        }

        $elapsed = number_format(microtime(true) - $startTs, 2);
        $this->info("Scanned={$scanned}, updated={$updated} in {$elapsed}s");

        return self::SUCCESS;
    }
}
