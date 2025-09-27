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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import UpsertAmenityDialog from '@/pages/management/amenities/dialogs/upsert-amenity-dialog';
import { createColumns } from '@/pages/management/amenities/tables/columns';
import type { AmenitiesPageProps, AmenityItem } from '@/types/management';

type PageProps = AmenitiesPageProps;

export default function AmenitiesIndex() {
    const { t: tAmen } = useTranslation('management/amenities');
    const { t: tEnum } = useTranslation('enum');
    const { t } = useTranslation();
    const { props } = usePage<
        InertiaPageProps & PageProps & { i18n?: { supported?: string[] } }
    >();

    const paginator = props.amenities;
    const rows = React.useMemo(() => paginator?.data ?? [], [paginator?.data]);
    const supported = React.useMemo(
        () => props?.i18n?.supported ?? ['id', 'en'],
        [props?.i18n?.supported],
    );

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
        item: AmenityItem | null;
    }>({ open: false, item: null });
    const openCreate = React.useCallback(
        () => setDialog({ open: true, item: null }),
        [],
    );
    const openEdit = React.useCallback(
        (item: AmenityItem) => setDialog({ open: true, item }),
        [],
    );
    const [confirmDel, setConfirmDel] = React.useState<{
        open: boolean;
        item: AmenityItem | null;
    }>({ open: false, item: null });
    const onDelete = React.useCallback((item: AmenityItem) => {
        setConfirmDel({ open: true, item });
    }, []);

    const columns: ColumnDef<AmenityItem>[] = React.useMemo(
        () => createColumns({ onEdit: openEdit, onDelete }),
        [openEdit, onDelete],
    );

    return (
        <AppLayout pageTitle={tAmen('title')} pageDescription={tAmen('desc')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{tAmen('title')}</CardTitle>
                        <CardDescription>{tAmen('desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                <Select
                                    value={
                                        q.category ? String(q.category) : 'all'
                                    }
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            category: v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue
                                            placeholder={tAmen(
                                                'all_categories',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {tAmen('all_categories')}
                                        </SelectItem>
                                        <SelectItem value="room">
                                            {tEnum('amenity_category.room')}
                                        </SelectItem>
                                        <SelectItem value="communal">
                                            {tEnum('amenity_category.communal')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Can all={['amenity.create']}>
                                <Button size="sm" onClick={openCreate}>
                                    <Plus className="mr-2 h-4 w-4" />{' '}
                                    {tAmen('add')}
                                </Button>
                            </Can>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<AmenityItem, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="name"
                            searchPlaceholder={tAmen('search_placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tAmen('empty')}
                        />
                    </CardContent>
                </Card>
            </div>

            <UpsertAmenityDialog
                open={dialog.open}
                onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                supportedLocales={supported}
                item={dialog.item}
            />

            <AlertDialog
                open={confirmDel.open}
                onOpenChange={(v) => setConfirmDel((s) => ({ ...s, open: v }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {tAmen('delete.title', 'Delete Amenity')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {tAmen('delete.confirm_named', {
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
                                        'management.amenities.destroy',
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
