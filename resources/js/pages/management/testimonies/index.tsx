import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataTableServer } from '@/components/ui/data-table-server';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import CurateTestimonyDialog from '@/pages/management/testimonies/dialogs/curate-testimony-dialog';
import { createColumns } from '@/pages/management/testimonies/tables/columns';
import type { TestimonyItem, TestimonyPageProps } from '@/types/management';

type PageProps = TestimonyPageProps;

export default function TestimoniesIndex() {
    const { t: tMng } = useTranslation('management/testimony');
    const { t: tEnum } = useTranslation('enum');
    const { props } = usePage<InertiaPageProps & PageProps>();

    const paginator = props.testimonies;
    const rows = React.useMemo(() => paginator?.data ?? [], [paginator?.data]);

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const [processing, setProcessing] = React.useState(false);
    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: paginator ?? null,
        initial: props.query,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const [dialog, setDialog] = React.useState<{
        open: boolean;
        item: TestimonyItem | null;
    }>({ open: false, item: null });
    const openEdit = React.useCallback(
        (item: TestimonyItem) => setDialog({ open: true, item }),
        [],
    );

    const onDelete = React.useCallback((item: TestimonyItem) => {
        router.delete(route('management.testimonies.destroy', item.id), {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    const tEnumSimple = React.useCallback(
        (k: string, d?: string) => tEnum(k, { defaultValue: d }),
        [tEnum],
    );

    const columns: ColumnDef<TestimonyItem>[] = React.useMemo(
        () =>
            createColumns({
                onCurate: openEdit,
                onDelete,
                tEnum: tEnumSimple,
            }),
        [openEdit, onDelete, tEnumSimple],
    );

    return (
        <AppLayout pageTitle={tMng('title')} pageDescription={tMng('desc')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{tMng('title')}</CardTitle>
                        <CardDescription>{tMng('desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                {/* Status filter */}
                                <select
                                    className="bg-background w-[200px] rounded-md border px-2 py-2 text-sm"
                                    value={q.status ? String(q.status) : 'all'}
                                    onChange={(e) =>
                                        onQueryChange({
                                            page: 1,
                                            status:
                                                e.target.value === 'all'
                                                    ? null
                                                    : e.target.value,
                                        })
                                    }
                                >
                                    <option value="all">
                                        {tMng('all_status')}
                                    </option>
                                    <option value="pending">
                                        {tEnum('testimony_status.pending')}
                                    </option>
                                    <option value="approved">
                                        {tEnum('testimony_status.approved')}
                                    </option>
                                    <option value="rejected">
                                        {tEnum('testimony_status.rejected')}
                                    </option>
                                    <option value="published">
                                        {tEnum('testimony_status.published')}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<TestimonyItem, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="content"
                            searchPlaceholder={tMng('search_placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tMng('empty')}
                        />
                    </CardContent>
                </Card>
            </div>

            <Can all={['testimony.update']}>
                <CurateTestimonyDialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    item={dialog.item}
                />
            </Can>
        </AppLayout>
    );
}
