import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Filter } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableServer, type QueryBag } from '@/components/ui/data-table-server';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import type { PageProps } from '@/types';
import { createColumns, type BookingRow } from '@/pages/management/booking/tables/columns';

type PageData = {
    bookings: {
        data: BookingRow[];
        current_page: number;
        per_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
    } | null;
    options: { statuses: { value: string; label: string }[] };
    query: Record<string, unknown>;
};

export default function ManagementBookingsIndex() {
    const { t } = useTranslation();
    const { t: tBooking, i18n } = useTranslation('management/booking');
    const { bookings: paginator, options, query } =
        usePage<PageProps<any>>().props as unknown as PageData;
    const rows = React.useMemo(() => paginator?.data ?? [], [paginator?.data]);

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );
    const [processing, setProcessing] = React.useState(false);
    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: paginator ?? null,
        initial: (query as QueryBag) || {},
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const statusValue: string =
        ((q as QueryBag & { status?: string | null }).status as string) ??
        'requested';

    const lang = i18n.language;
    const columns: ColumnDef<BookingRow>[] = React.useMemo(() => {
        void lang;
        return createColumns<BookingRow>({
            onDetail: (b) =>
                router.visit(route('management.bookings.show', { booking: b.id })),
            onApprove: (b) =>
                router.post(
                    route('management.bookings.approve', { booking: b.id }),
                    {},
                    { preserveScroll: true },
                ),
        });
    }, [lang]);

    return (
        <AppLayout pageTitle={tBooking('title')} pageDescription={tBooking('desc')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Filter className="h-4 w-4" /> {t('common.filter')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-[160px_1fr_auto] md:items-end">
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('common.status')}
                                </Label>
                                <Select
                                    value={statusValue || 'requested'}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            status: v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue
                                            placeholder={t('common.all_statuses')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('common.all_statuses')}
                                        </SelectItem>
                                        {(options.statuses || []).map((s) => {
                                            const slug = String(s.value)
                                                .trim()
                                                .toLowerCase()
                                                .replace(/\s+/g, '_');
                                            return (
                                                <SelectItem
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {t(`booking.status.${slug}`, {
                                                        ns: 'enum',
                                                        defaultValue:
                                                            s.label || String(s.value),
                                                    })}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div />
                            <div className="flex items-end" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<BookingRow, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={((q as QueryBag & { q?: string | null }).q ?? '') as string}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, q: v || null })
                            }
                            searchKey="number"
                            searchPlaceholder={tBooking('search_placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tBooking('list.empty')}
                            showColumn
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
