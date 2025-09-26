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
import UpsertFloorDialog from '@/features/floor/dialogs/upsert-floor-dialog';
import { createColumns } from '@/features/floor/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import type { FloorItem, FloorsPageProps } from '@/types/management';

type PageProps = FloorsPageProps;

export default function FloorsIndex() {
    const { t: tF } = useTranslation('management/floors');
    const { t } = useTranslation();
    const { props } = usePage<InertiaPageProps & PageProps>();

    const paginator = props.floors;
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
        item: FloorItem | null;
    }>({ open: false, item: null });
    const openCreate = React.useCallback(
        () => setDialog({ open: true, item: null }),
        [],
    );
    const openEdit = React.useCallback(
        (item: FloorItem) => setDialog({ open: true, item }),
        [],
    );
    const [confirmDel, setConfirmDel] = React.useState<{
        open: boolean;
        item: FloorItem | null;
    }>({ open: false, item: null });
    const onDelete = React.useCallback(
        (item: FloorItem) => setConfirmDel({ open: true, item }),
        [],
    );

    const columns: ColumnDef<FloorItem>[] = React.useMemo(
        () => createColumns({ onEdit: openEdit, onDelete }),
        [openEdit, onDelete],
    );

    return (
        <AuthLayout pageTitle={tF('title')} pageDescription={tF('desc')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{tF('title')}</CardTitle>
                        <CardDescription>{tF('desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2" />
                            <Can all={['floor.create']}>
                                <Button size="sm" onClick={openCreate}>
                                    <Plus className="mr-2 h-4 w-4" />{' '}
                                    {tF('add')}
                                </Button>
                            </Can>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<FloorItem, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="name"
                            searchPlaceholder={tF('search_placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tF('empty')}
                        />
                    </CardContent>
                </Card>
            </div>

            <UpsertFloorDialog
                open={dialog.open}
                onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                item={dialog.item}
                buildings={
                    (props.options?.buildings ?? []) as {
                        id: number;
                        name: string;
                    }[]
                }
            />

            <AlertDialog
                open={confirmDel.open}
                onOpenChange={(v) => setConfirmDel((s) => ({ ...s, open: v }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {tF('delete.title', 'Delete Floor')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {tF('delete.confirm_named', {
                                name:
                                    confirmDel.item?.name ??
                                    confirmDel.item?.level ??
                                    '',
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
                                    route('management.floors.destroy', it.id),
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
        </AuthLayout>
    );
}
