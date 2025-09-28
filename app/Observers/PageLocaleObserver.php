<?php

namespace App\Observers;

use App\Models\PageLocale;
use Illuminate\Support\Facades\Cache;

class PageLocaleObserver
{
    public function saved(PageLocale $loc): void
    {
        $this->flushFor($loc);
    }

    public function deleted(PageLocale $loc): void
    {
        $this->flushFor($loc);
    }

    protected function flushFor(PageLocale $loc): void
    {
        $slug   = optional($loc->page)->slug;
        $locale = $loc->locale;
        if (!$slug) {
            return;
        }
        Cache::forget(sprintf('page:%s:%s:pub', $slug, $locale));
        Cache::forget(sprintf('page:%s:%s:preview', $slug, $locale));
        Cache::forget(sprintf('page:%s:%s:draft', $slug, $locale));
        Cache::forget(sprintf('cmsPages:%s', $locale));
    }
}
