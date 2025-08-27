import { router, usePage } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import React from 'react';

import type { Crumb } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';

import { createColumns } from './columns';
import DetailDialog from './detail';

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

const breadcrumbs: Crumb[] = [
    { label: 'Akses & Peran', href: '#' },
    { label: 'Audit Log' },
];

export default function AuditLogIndex() {
    const { props } = usePage<PageProps>();
    const { logs, query } = props;

    const initialAuto = React.useMemo(() => {
        if (typeof window === 'undefined') return 0;
        const sp = new URLSearchParams(window.location.search);
        const v = sp.get('auto');
        const n = v ? parseInt(v, 10) : 0;
        return Number.isFinite(n) ? Math.max(0, n) : 0;
    }, []);
    const [autoSec, setAutoSec] = React.useState<number>(initialAuto);

    const setUrlAuto = React.useCallback((sec: number) => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (sec > 0) {
            url.searchParams.set('auto', String(sec));
        } else {
            url.searchParams.delete('auto');
        }
        window.history.replaceState({}, '', url.toString());
    }, []);

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

    const timerRef = React.useRef<number | null>(null);

    const clearTimer = React.useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

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

    const reload = React.useCallback(() => {
        if (processing) return;
        setProcessing(true);
        router.reload({
            preserveUrl: true,
            only: ['logs', 'query'],
            onFinish: () => setProcessing(false),
        });
    }, [processing]);

    const maybeStartTimer = React.useCallback(() => {
        clearTimer();
        if (
            autoSec > 0 &&
            document.visibilityState === 'visible' &&
            !processing
        ) {
            timerRef.current = window.setInterval(() => {
                reload();
            }, autoSec * 1000);
        }
    }, [autoSec, clearTimer, reload, processing]);

    React.useEffect(() => {
        maybeStartTimer();
        return clearTimer;
    }, [autoSec, maybeStartTimer, clearTimer]);

    React.useEffect(() => {
        const onFocus = () => maybeStartTimer();
        const onBlur = () => clearTimer();
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                maybeStartTimer();
            } else {
                clearTimer();
            }
        };
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [maybeStartTimer, clearTimer]);

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
            breadcrumbs={breadcrumbs}
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
                        <div className="flex items-center justify-end gap-2">
                            <Select
                                value={String(autoSec || 0)}
                                onValueChange={(v) => {
                                    const sec = parseInt(v, 10) || 0;
                                    setAutoSec(sec);
                                    setUrlAuto(sec);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[160px]">
                                    <SelectValue placeholder="Auto refresh" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="0">Auto: Off</SelectItem>
                                    <SelectItem value="30">
                                        Auto: 30 detik
                                    </SelectItem>
                                    <SelectItem value="60">
                                        Auto: 1 menit
                                    </SelectItem>
                                    <SelectItem value="300">
                                        Auto: 5 menit
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={reload}
                                className="inline-flex h-9 items-center gap-2"
                                disabled={processing}
                                type="button"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Muat ulang
                            </Button>
                        </div>
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
