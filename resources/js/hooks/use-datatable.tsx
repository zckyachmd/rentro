'use client';

import { router } from '@inertiajs/react';
import * as React from 'react';

import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';

export type ServerQueryState = {
    page: number;
    perPage: number;
    search: string;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    [key: string]: unknown;
};

export function useServerTable(
    opts: {
        paginator?: PaginatorMeta | null;
        initial?: QueryBag & Record<string, unknown>;
        currentPath?: string;
        fixedParams?: Record<string, unknown>;
        onStart?: () => void;
        onFinish?: () => void;
    } = {},
) {
    const { paginator, initial, fixedParams, onStart, onFinish } = opts;

    const currentPath = React.useMemo(
        () =>
            opts.currentPath ??
            (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [opts.currentPath],
    );

    const q: ServerQueryState = React.useMemo(
        () => ({
            page: initial?.page ?? paginator?.current_page ?? 1,
            perPage: initial?.perPage ?? paginator?.per_page ?? 20,
            search: initial?.search ?? '',
            sort: initial?.sort ?? null,
            dir: initial?.dir ?? null,
            ...Object.fromEntries(
                Object.entries(initial ?? {}).filter(
                    ([k]) =>
                        !['page', 'perPage', 'search', 'sort', 'dir'].includes(
                            k,
                        ),
                ),
            ),
        }),
        [initial, paginator?.current_page, paginator?.per_page],
    );

    const onQueryChange = React.useCallback(
        (next: {
            page?: number;
            per_page?: number;
            search?: string;
            sort?: string | null;
            dir?: 'asc' | 'desc' | null;
            [key: string]: unknown;
        }) => {
            const nextPage = next.page ?? q.page;
            const nextPerPage = next.per_page ?? q.perPage;
            const nextSearch = next.search ?? (q.search || undefined);
            const nextSort = next.sort ?? q.sort ?? undefined;
            const nextDir = next.dir ?? q.dir ?? undefined;

            const baseKnown = [
                'page',
                'perPage',
                'per_page',
                'search',
                'sort',
                'dir',
            ];
            const extraKeysFromState = Object.keys(q).filter(
                (k) => !baseKnown.includes(k),
            );
            const extraKeysFromNext = Object.keys(next).filter(
                (k) => !baseKnown.includes(k),
            );
            const mergedExtraKeys = Array.from(
                new Set([...extraKeysFromState, ...extraKeysFromNext]),
            );
            const nextExtras: Record<string, unknown> = {};
            for (const k of mergedExtraKeys) {
                nextExtras[k] =
                    k in next ? next[k] : (q as Record<string, unknown>)[k];
            }

            const same =
                Number(q.page) === Number(nextPage) &&
                Number(q.perPage) === Number(nextPerPage) &&
                (q.search || undefined) === nextSearch &&
                (q.sort ?? undefined) === nextSort &&
                (q.dir ?? undefined) === nextDir &&
                mergedExtraKeys.every((k) => {
                    const a = (q as Record<string, unknown>)[k];
                    const b = nextExtras[k];
                    return (a === null ? null : a) === (b === null ? null : b);
                });
            if (same) return;

            router.get(
                currentPath,
                {
                    page: nextPage,
                    per_page: nextPerPage,
                    search: nextSearch || undefined,
                    sort: nextSort,
                    dir: nextDir,
                    ...(fixedParams ?? {}),
                    ...Object.fromEntries(
                        Object.entries(nextExtras).map(([k, v]) => [
                            k,
                            v ?? undefined,
                        ]),
                    ),
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onStart,
                    onFinish,
                },
            );
        },
        [q, fixedParams, currentPath, onStart, onFinish],
    );

    const handleSortChange = React.useCallback(
        ({
            sort,
            dir,
        }: {
            sort?: string | null;
            dir?: 'asc' | 'desc' | null;
        }) => {
            onQueryChange({ page: 1, sort: sort ?? null, dir: dir ?? null });
        },
        [onQueryChange],
    );

    return { q, onQueryChange, handleSortChange };
}
