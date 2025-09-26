import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DataTableServer,
    type QueryBag,
} from '@/components/ui/data-table-server';
import AuditDetailDialog from '@/features/audit/dialogs/detail-dialog';
import { createColumns } from '@/features/audit/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import type {
    ActivityItem,
    AuditNextShape as NextShape,
    AuditPageProps as PageProps,
    AuditSafePayload as SafePayload,
} from '@/types/management';

function useDebounced<P extends unknown[]>(
    fn: (...args: P) => void,
    delay = 300,
) {
    const fnRef = React.useRef(fn);
    const tRef = React.useRef<number | null>(null);
    React.useEffect(() => {
        fnRef.current = fn;
    }, [fn]);
    const clear = React.useCallback(() => {
        if (tRef.current) {
            window.clearTimeout(tRef.current);
            tRef.current = null;
        }
    }, []);
    const debounced = React.useCallback(
        (...args: P) => {
            clear();
            tRef.current = window.setTimeout(
                () => fnRef.current(...args),
                delay,
            );
        },
        [clear, delay],
    );
    React.useEffect(() => clear, [clear]);
    return debounced as typeof fn;
}

export default function AuditLogIndex() {
    const { i18n } = useTranslation();
    const { t: tAudit } = useTranslation('management/audit');
    const { props } = usePage<InertiaPageProps & PageProps>();
    const { logs, query } = props;

    const initial: QueryBag | undefined = query
        ? {
              search: query.search,
              page: query.page,
              perPage: query.per_page ?? query.perPage,
              sort: query.sort ?? null,
              dir: (query.dir as 'asc' | 'desc' | null) ?? null,
          }
        : undefined;

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const [processing, setProcessing] = React.useState(false);

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: logs,
        initial,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const debouncedSearch = useDebounced((value: string | undefined) => {
        onQueryChange({ page: 1, q: value, search: value });
    }, 350);

    // SafePayload, NextShape moved to pages/types

    const safeOnQueryChange = React.useCallback(
        (payload: SafePayload) => {
            if (processing) return;

            const next: NextShape = { ...(payload as Record<string, unknown>) };

            if (next.search == null) delete next.search;
            if (next.sort === null) delete next.sort;
            if (next.dir === null) delete next.dir;

            onQueryChange(next);
        },
        [onQueryChange, processing],
    );

    const [detail, setDetail] = React.useState<{
        open: boolean;
        item: ActivityItem | null;
    }>({ open: false, item: null });

    const lang = i18n.language;
    const tableColumns = React.useMemo(() => {
        void lang;
        return createColumns((row) => setDetail({ open: true, item: row }));
    }, [lang]);

    return (
        <AuthLayout
            pageTitle={tAudit('title')}
            pageDescription={tAudit('desc')}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{tAudit('list_title')}</CardTitle>
                        <CardDescription>{tAudit('desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-end gap-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<ActivityItem, unknown>
                            columns={tableColumns}
                            rows={logs.data}
                            paginator={logs}
                            search={q.search}
                            onSearchChange={(v) => debouncedSearch(v)}
                            searchKey="description"
                            searchPlaceholder={tAudit('search_placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText={tAudit('empty')}
                            autoRefreshDefault="1m"
                            showRefresh={true}
                        />
                    </CardContent>
                </Card>
            </div>

            <AuditDetailDialog
                open={detail.open}
                item={detail.item}
                onOpenChange={(o) => setDetail((s) => ({ ...s, open: o }))}
            />
        </AuthLayout>
    );
}
