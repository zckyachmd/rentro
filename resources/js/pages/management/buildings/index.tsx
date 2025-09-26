import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataTableServer } from '@/components/ui/data-table-server';
import UpsertBuildingDialog from '@/features/building/dialogs/upsert-building-dialog';
import { createColumns } from '@/features/building/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import type { BuildingItem, BuildingsPageProps } from '@/types/management';

type PageProps = BuildingsPageProps;

export default function BuildingsIndex() {
    const { t: tB } = useTranslation('management/buildings');
    const { t } = useTranslation();
    const { props } = usePage<InertiaPageProps & PageProps>();

    const paginator = props.buildings;
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
        item: BuildingItem | null;
    }>({ open: false, item: null });
    const openCreate = React.useCallback(
        () => setDialog({ open: true, item: null }),
        [],
    );
    const openEdit = React.useCallback(
        (item: BuildingItem) => setDialog({ open: true, item }),
        [],
    );
    const [confirmDel, setConfirmDel] = React.useState<{
        open: boolean;
        item: BuildingItem | null;
    }>({ open: false, item: null });
    const onDelete = React.useCallback(
        (item: BuildingItem) => setConfirmDel({ open: true, item }),
        [],
    );

    const columns: ColumnDef<BuildingItem>[] = React.useMemo(
        () => createColumns({ onEdit: openEdit, onDelete }),
        [openEdit, onDelete],
    );

    return (
        <AppLayout pageTitle={tB('title')} pageDescription={tB('desc')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{tB('title')}</CardTitle>
                        <CardDescription>{tB('desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2" />
                            <Can all={['building.create']}>
                                <Button size="sm" onClick={openCreate}>
                                    <Plus className="mr-2 h-4 w-4" />{' '}
                                    {tB('add')}
                                </Button>
                            </Can>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<BuildingItem, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="name"
                            searchPlaceholder={tB('search_placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tB('empty')}
                        />
                    </CardContent>
                </Card>
            </div>

            <UpsertBuildingDialog
                open={dialog.open}
                onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                item={dialog.item}
            />

            <AlertDialog
                open={confirmDel.open}
                onOpenChange={(v) => setConfirmDel((s) => ({ ...s, open: v }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {tB('delete.title', 'Delete Building')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {tB('delete.confirm_named', {
                                name: confirmDel.item?.name ?? '',
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                const it = confirmDel.item;
                                if (!it) return;
                                router.delete(
                                    route(
                                        'management.buildings.destroy',
                                        it.id,
                                    ),
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                        onFinish: () =>
                                            setConfirmDel({
                                                open: false,
                                                item: null,
                                            }),
                                    },
                                );
                            }}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
