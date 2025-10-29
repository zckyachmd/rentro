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
import { Card, CardContent } from '@/components/ui/card';
import { DataTableServer } from '@/components/ui/data-table-server';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import UpsertRoomTypeDialog from '@/pages/management/room-types/dialogs/upsert-room-type-dialog';
import { createColumns } from '@/pages/management/room-types/tables/columns';
import type {
    ManagementRoomTypeItem,
    RoomTypesPageProps,
} from '@/types/management';

type PageProps = RoomTypesPageProps;

export default function RoomTypesIndex() {
    const { t: tType } = useTranslation('management/room-types');
    const { t } = useTranslation();
    const { props } = usePage<InertiaPageProps & PageProps>();

    const paginator = props.room_types;
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
        item: ManagementRoomTypeItem | null;
    }>({ open: false, item: null });
    const openCreate = React.useCallback(
        () => setDialog({ open: true, item: null }),
        [],
    );
    const openEdit = React.useCallback(
        (item: ManagementRoomTypeItem) => setDialog({ open: true, item }),
        [],
    );
    const [confirmDel, setConfirmDel] = React.useState<{
        open: boolean;
        item: ManagementRoomTypeItem | null;
    }>({ open: false, item: null });
    const onDelete = React.useCallback((item: ManagementRoomTypeItem) => {
        setConfirmDel({ open: true, item });
    }, []);

    const columns: ColumnDef<ManagementRoomTypeItem>[] = React.useMemo(
        () => createColumns({ onEdit: openEdit, onDelete }),
        [openEdit, onDelete],
    );

    return (
        <AppLayout
            pageTitle={tType('title')}
            pageDescription={tType('desc')}
            actions={
                <Can all={['room-type.create']}>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> {tType('add')}
                    </Button>
                </Can>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardContent>
                        <DataTableServer<ManagementRoomTypeItem, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="name"
                            searchPlaceholder={tType('search_placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tType('empty')}
                        />
                    </CardContent>
                </Card>
            </div>

            <UpsertRoomTypeDialog
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
                            {tType('delete.title', 'Delete Room Type')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {tType('delete.confirm_named', {
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
                                        'management.room-types.destroy',
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
