import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import * as React from 'react';

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
import UpsertPromotionDialog from '@/pages/management/promotion/dialogs/upsert-promotion-dialog';
import { createColumns } from '@/pages/management/promotion/tables/columns';
import type { PromotionItem, PromotionsPageProps } from '@/types/management';

type PageProps = PromotionsPageProps;

export default function PromotionsIndex() {
    const { props } = usePage<InertiaPageProps & PageProps>();

    const paginator = props.promotions;
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
        item: PromotionItem | null;
    }>({ open: false, item: null });
    const openCreate = React.useCallback(
        () => setDialog({ open: true, item: null }),
        [],
    );
    const openEdit = React.useCallback(
        (item: PromotionItem) => setDialog({ open: true, item }),
        [],
    );
    const [confirmDel, setConfirmDel] = React.useState<{
        open: boolean;
        item: PromotionItem | null;
    }>({ open: false, item: null });
    const onDelete = React.useCallback((item: PromotionItem) => {
        setConfirmDel({ open: true, item });
    }, []);

    const columns: ColumnDef<unknown>[] = React.useMemo(
        () => createColumns({ onEdit: openEdit, onDelete }),
        [openEdit, onDelete],
    );

    return (
        <AppLayout
            pageTitle="Promotions"
            pageDescription="Manage discount promotions"
            actions={
                <Can all={['promotion.create']}>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add Promotion
                    </Button>
                </Can>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardContent>
                        <DataTableServer<unknown, unknown>
                            columns={columns}
                            rows={rows as unknown[]}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="name"
                            searchPlaceholder="Search by name or slug"
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText="No promotions yet"
                        />
                    </CardContent>
                </Card>
            </div>

            <UpsertPromotionDialog
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
                        <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure want to delete "
                            {confirmDel.item?.name ?? ''}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                const it = confirmDel.item;
                                if (!it) return;
                                router.delete(
                                    route(
                                        'management.promotions.destroy',
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
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
