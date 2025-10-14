<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\ContentStore;
use Inertia\Inertia;

class AboutController extends Controller
{
    public function __invoke()
    {
        $locale  = app()->getLocale();
        $content = ContentStore::getSection('about', 'content', $locale);

        return Inertia::render('public/about/index', [
            'sections' => [
                'content' => $content,
            ],
            'seo' => [
                'title' => $content['title'] ?? 'About',
                'desc'  => $content['subtitle'] ?? null,
            ],
        ]);
    }
}
