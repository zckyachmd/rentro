import { usePage } from '@inertiajs/react';

import { RichText } from '@/components/blocks/RichText';
import { PublicLayout } from '@/layouts';
import type { PageProps } from '@/types';

type Props = {
    sections: {
        content?: { body?: string | null };
    };
    seo?: { title?: string | null; desc?: string | null };
};

export default function AboutPage() {
    const { props } = usePage<PageProps<Props>>();
    const content = props.sections?.content ?? {};
    const seo = props.seo ?? {};

    return (
        <PublicLayout
            title={seo.title ?? 'Tentang'}
            description={seo.desc ?? undefined}
        >
            <div className="mx-auto max-w-5xl px-4 py-10">
                <RichText body={content.body ?? ''} />
            </div>
        </PublicLayout>
    );
}
