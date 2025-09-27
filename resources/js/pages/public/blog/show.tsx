import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';

import { PublicLayout } from '@/layouts';

export default function BlogShowPage() {
    const { props } = usePage<InertiaPageProps & { slug?: string }>();
    const slug = props.slug ?? 'artikel';
    return (
        <PublicLayout
            title="Detail Artikel"
            description="Baca artikel lengkap seputar Rentro dan manajemen properti."
            seo={{
                type: 'article',
                title: slug.replace(/[-_]/g, ' ') + ' - Blog',
                canonical: route(
                    'public.blog.show',
                    slug as never,
                ) as unknown as string,
            }}
        >
            <article className="prose prose-neutral dark:prose-invert max-w-none">
                <h2 className="mb-2 capitalize">
                    {slug.replace(/[-_]/g, ' ')}
                </h2>
                <p className="text-muted-foreground">
                    Konten artikel akan ditampilkan di sini.
                </p>
            </article>
        </PublicLayout>
    );
}
