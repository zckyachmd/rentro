import { PublicLayout } from '@/layouts';

export default function BlogIndexPage() {
    return (
        <PublicLayout
            title="Blog"
            description="Artikel dan informasi terbaru seputar Rentro."
            seo={{
                canonical: '/blog',
                image: '/logo.svg',
            }}
        >
            <div className="space-y-4">
                <p className="text-muted-foreground">
                    Daftar artikel blog akan tampil di sini.
                </p>
            </div>
        </PublicLayout>
    );
}
