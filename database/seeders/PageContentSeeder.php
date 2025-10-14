<?php

namespace Database\Seeders;

use App\Models\PageContent;
use Illuminate\Database\Seeder;

class PageContentSeeder extends Seeder
{
    public function run(): void
    {
        // Home hero (ID)
        PageContent::setValue('home', 'hero', 'title', 'id', 'Temukan kost ideal');
        PageContent::setValue('home', 'hero', 'subtitle', 'id', 'Pilih sesuai kebutuhan & budget');
        PageContent::setValue('home', 'hero', 'cta_label', 'id', 'Lihat Katalog');

        // Home hero (EN)
        PageContent::setValue('home', 'hero', 'title', 'en', 'Find your ideal room');
        PageContent::setValue('home', 'hero', 'subtitle', 'en', 'Choose by your needs and budget');
        PageContent::setValue('home', 'hero', 'cta_label', 'en', 'Browse Catalog');

        // Privacy content (ID)
        PageContent::setValue('privacy', 'content', 'body', 'id', "## Kebijakan Privasi\n\nKami menjaga data Anda dengan serius. ...");

        // Privacy content (EN)
        PageContent::setValue('privacy', 'content', 'body', 'en', "## Privacy Policy\n\nWe take your data seriously. ...");
    }
}

