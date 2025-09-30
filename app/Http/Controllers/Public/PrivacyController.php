<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\ContentStore;
use Inertia\Inertia;

class PrivacyController extends Controller
{
    public function __invoke()
    {
        $locale  = app()->getLocale();
        $content = ContentStore::getSection('privacy', 'content', $locale);

        return Inertia::render('public/privacy/index', [
            'sections' => [
                'content' => $content,
            ],
            'seo' => [
                'title' => 'Privacy',
                'desc'  => null,
            ],
        ]);
    }
}
