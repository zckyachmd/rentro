// Testimony management types

import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';

export type TestimonyItem = {
    id: number;
    user: { id: number; name: string } | null;
    content_original: string;
    content_curated: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'published';
    curator?: { id: number; name: string } | null;
    curated_at?: string | null;
    published_at?: string | null;
    created_at?: string | null;
};

export type TestimonyPaginator = { data: TestimonyItem[] } & PaginatorMeta;

export type TestimonyPageProps = {
    testimonies: TestimonyPaginator;
    query: QueryBag & { status?: string | null };
};
