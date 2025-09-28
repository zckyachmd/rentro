<?php

namespace App\Console\Commands;

use App\Models\PageLocale;
use Illuminate\Console\Command;

class ContentSchedule extends Command
{
    protected $signature   = 'content:schedule';
    protected $description = 'Process scheduled publish/unpublish for page locales';

    public function handle(): int
    {
        $now = now();

        // Publish due
        PageLocale::query()
            ->where('status', 'scheduled')
            ->whereNotNull('publish_at')
            ->where('publish_at', '<=', $now)
            ->each(function (PageLocale $loc): void {
                $loc->status           = 'published';
                $loc->version          = (int) $loc->version + 1;
                $loc->seo_published    = $loc->seo_draft;
                $loc->fields_published = $loc->fields_draft;
                $loc->blocks_published = $loc->blocks_draft;
                $loc->save();
                $this->info("Published locale #{$loc->id}");
            });

        // Unpublish due
        PageLocale::query()
            ->where('status', 'published')
            ->whereNotNull('unpublish_at')
            ->where('unpublish_at', '<=', $now)
            ->each(function (PageLocale $loc): void {
                $loc->status = 'archived';
                $loc->save();
                $this->info("Archived locale #{$loc->id}");
            });

        return self::SUCCESS;
    }
}
