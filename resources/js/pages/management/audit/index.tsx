import { usePage } from '@inertiajs/react';
import React from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DataTableServer,
    PaginatorMeta,
    type QueryBag,
} from '@/components/ui/data-table-server';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';

import { createColumns } from './columns';
import DetailDialog from './dialogs/detail';

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

export interface UserLite {
    id?: number;
    name?: string;
    email?: string;
}

export interface ActivityItem {
    id: number;
    log_name?: string | null;
    description?: string | null;
    event?: string | null;
    subject_id?: number | string | null;
    subject_type?: string | null;
    causer_id?: number | null;
    properties?: Record<string, unknown> | null;
    created_at: string;
    updated_at?: string;
    causer?: UserLite | null;
    subject?: { id?: number | string | null } | null;
}

type LogPaginator = { data: ActivityItem[] } & PaginatorMeta;

type PageQuery = QueryBag & {
    user_id: number | string | null;
    subject_type: string | null;
    event: string | null;
    per_page?: number;
};

type PageProps = {
    [key: string]: unknown;
    logs: LogPaginator;
    query?: PageQuery;
};

export default function AuditLogIndex() {
    const { props } = usePage<PageProps>();
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

    type SafePayload = Partial<
        Omit<QueryBag, 'search' | 'sort' | 'dir'> & {
            search?: string | null;
            sort?: string | null;
            dir?: 'asc' | 'desc' | null;
        }
    > & { q?: string };

    type NextShape = {
        [key: string]: unknown;
        page?: number;
        per_page?: number;
        search?: string;
        sort?: string | null;
        dir?: 'asc' | 'desc' | null;
        q?: string;
    };

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

    const tableColumns = React.useMemo(
        () => createColumns((row) => setDetail({ open: true, item: row })),
        [],
    );

    return (
        <AuthLayout
            pageTitle="Audit Log"
            pageDescription="Jejak aktivitas sistem: siapa melakukan apa dan kapan."
        >
            <div className="space-y-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Audit Log</CardTitle>
                        <CardDescription>
                            Lacak aktivitas penting di sistem. Gunakan pencarian
                            untuk memfilter berdasarkan deskripsi, log name,
                            atau event.
                        </CardDescription>
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
                            searchPlaceholder="Cari deskripsi / log name / event…"
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText="Tidak ada log."
                            autoRefreshDefault="1m"
                            showRefresh={true}
                        />
                    </CardContent>
                </Card>
            </div>

            <DetailDialog
                open={detail.open}
                item={detail.item}
                onOpenChange={(o) => setDetail((s) => ({ ...s, open: o }))}
            />
        </AuthLayout>
    );
}
