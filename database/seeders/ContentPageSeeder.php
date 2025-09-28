<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\PageLocale;
use Illuminate\Database\Seeder;

class ContentPageSeeder extends Seeder
{
    public function run(): void
    {
        $slugs = ['about', 'help', 'privacy', 'terms', 'contact'];
        foreach ($slugs as $slug) {
            $page = Page::firstOrCreate(['slug' => $slug]);

            foreach (['id', 'en'] as $loc) {
                PageLocale::firstOrCreate(
                    ['page_id' => $page->id, 'locale' => $loc],
                    [
                        'status'        => 'draft',
                        'title'         => ucfirst($slug),
                        'description'   => null,
                        'fields_draft'  => ['headline' => ucfirst($slug)],
                        'blocks_draft'  => [],
                        'seo_draft'     => ['title' => ucfirst($slug)],
                        'version'       => 0,
                    ]
                );
            }
        }
    }
}

