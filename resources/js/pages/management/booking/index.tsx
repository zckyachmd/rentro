import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Filter } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DatePickerInput } from '@/components/date-picker';
import { QuickRange } from '@/components/quick-range';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DataTableServer,
    type QueryBag,
} from '@/components/ui/data-table-server';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import {
    createColumns,
    type BookingRow,
} from '@/pages/management/booking/tables/columns';
import type { PageProps } from '@/types';

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
    summary?: {
        count: number;
        count_requested: number;
        count_approved: number;
        count_rejected: number;
    } | null;
};

export default function ManagementBookingsIndex() {
    const { t } = useTranslation();
    const { t: tBooking, i18n } = useTranslation('management/booking');
    const {
        bookings: paginator,
        options,
        query,
        summary,
    } = usePage<PageProps<Record<string, unknown>>>()
        .props as unknown as PageData;
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
        'all';

    const [start, setStart] = React.useState<string | null>(
        (query?.start as string | undefined) || null,
    );
    const [end, setEnd] = React.useState<string | null>(
        (query?.end as string | undefined) || null,
    );
    const applyDates = React.useCallback(() => {
        onQueryChange({ page: 1, start: start || null, end: end || null });
    }, [onQueryChange, start, end]);

    const lang = i18n.language;
    const columns: ColumnDef<BookingRow>[] = React.useMemo(() => {
        void lang;
        return createColumns<BookingRow>({
            onDetail: (b) =>
                router.visit(
                    route('management.bookings.show', { booking: b.id }),
                ),
        });
    }, [lang]);

    return (
        <AppLayout
            pageTitle={tBooking('title')}
            pageDescription={tBooking('desc')}
            titleIcon="CalendarDays"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Filter className="h-4 w-4" />{' '}
                                {t('common.filter')}
                            </CardTitle>
                            {summary ? (
                                <div className="text-muted-foreground text-xs">
                                    <span className="mr-3">
                                        {t('common.total', 'Total')}:&nbsp;
                                        <span className="text-foreground font-medium">
                                            {summary.count}
                                        </span>
                                    </span>
                                    <span className="mr-3">
                                        {tBooking(
                                            'summary.requested',
                                            'Requested',
                                        )}
                                        :&nbsp;
                                        <span className="text-foreground font-medium">
                                            {summary.count_requested}
                                        </span>
                                    </span>
                                    <span className="mr-3">
                                        {tBooking(
                                            'summary.approved',
                                            'Approved',
                                        )}
                                        :&nbsp;
                                        <span className="text-foreground font-medium">
                                            {summary.count_approved}
                                        </span>
                                    </span>
                                    <span>
                                        {tBooking(
                                            'summary.rejected',
                                            'Rejected',
                                        )}
                                        :&nbsp;
                                        <span className="text-foreground font-medium">
                                            {summary.count_rejected}
                                        </span>
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('common.status')}
                                </Label>
                                <Select
                                    value={statusValue || 'all'}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            status: v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue
                                            placeholder={t(
                                                'common.all_statuses',
                                            )}
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
                                                    {t(
                                                        `booking.status.${slug}`,
                                                        {
                                                            ns: 'enum',
                                                            defaultValue:
                                                                s.label ||
                                                                String(s.value),
                                                        },
                                                    )}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('dashboard.filters.start')}
                                </Label>
                                <DatePickerInput
                                    value={start}
                                    onChange={setStart}
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('dashboard.filters.end')}
                                </Label>
                                <DatePickerInput
                                    value={end}
                                    onChange={setEnd}
                                />
                            </div>
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={applyDates}
                                >
                                    {t('dashboard.filters.apply')}
                                </Button>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                            <QuickRange
                                onSelect={(s, e) => {
                                    setStart(s);
                                    setEnd(e);
                                    onQueryChange({
                                        page: 1,
                                        start: s,
                                        end: e,
                                    });
                                }}
                                showReset
                                resetDisabled={!start && !end}
                                onReset={() => {
                                    setStart(null);
                                    setEnd(null);
                                    onQueryChange({
                                        page: 1,
                                        start: null,
                                        end: null,
                                    });
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                        const qs = new URLSearchParams();
                                        if (
                                            statusValue &&
                                            statusValue !== 'all'
                                        )
                                            qs.set('status', statusValue);
                                        if (start) qs.set('start', start);
                                        if (end) qs.set('end', end);
                                        const currentSearch =
                                            (
                                                q as QueryBag & {
                                                    q?: string | null;
                                                }
                                            ).q ?? '';
                                        if (currentSearch)
                                            qs.set('q', String(currentSearch));
                                        const url = `${route('management.bookings.export')}${qs.toString() ? `?${qs.toString()}` : ''}`;
                                        if (typeof window !== 'undefined')
                                            window.open(url, '_blank');
                                    }}
                                >
                                    {t('common.export_csv')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<BookingRow, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={
                                ((q as QueryBag & { q?: string | null }).q ??
                                    '') as string
                            }
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
                            autoRefreshDefault="1m"
                            showRefresh
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
