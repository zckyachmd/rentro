import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
import PermissionsDialog from '@/features/role/dialogs/permissions-dialog';
import RoleUpsertDialog from '@/features/role/dialogs/roles-dialog';
import { createColumns } from '@/features/role/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import type {
    RoleDialogKey as DialogKey,
    RolePageProps as PageProps,
    RoleDialogs,
    RoleItem,
} from '@/types/management';

export default function RolesIndex() {
    const { t, i18n } = useTranslation();
    const { props } = usePage<InertiaPageProps & PageProps>();
    const { roles, permissions = [], guards = [], query } = props;

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const [processing, setProcessing] = React.useState(false);

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: roles,
        initial: query,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const [dialog, setDialog] = React.useState<RoleDialogs>({
        edit: { open: false, role: null },
        perm: { open: false, role: null },
        del: { open: false, role: null },
    });

    const openDialog = React.useCallback(
        (key: DialogKey, role: RoleItem | null = null) =>
            setDialog((s) => ({ ...s, [key]: { open: true, role } })),
        [],
    );

    const openCreate = React.useCallback(
        () => openDialog('edit', null),
        [openDialog],
    );

    const handleConfirmDelete = React.useCallback(() => {
        const roleId = dialog.del.role?.id;
        if (!roleId) return;

        router.delete(route('management.roles.destroy', roleId), {
            preserveScroll: true,
            onSuccess: () => {
                setDialog((s) => ({ ...s, del: { open: false, role: null } }));
            },
        });
    }, [dialog.del.role?.id]);

    const lang = i18n.language;
    const tableColumns = React.useMemo(() => {
        void lang;
        return createColumns({
            onEdit: (role: RoleItem) => openDialog('edit', role),
            onPermissions: (role: RoleItem) => openDialog('perm', role),
            onDelete: (role: RoleItem) => openDialog('del', role),
        });
    }, [openDialog, lang]);

    return (
        <AppLayout
            pageTitle={t('management.role.title')}
            pageDescription={t('management.role.desc')}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{t('management.role.list_title')}</CardTitle>
                        <CardDescription>
                            {t('management.role.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2" />

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={openCreate}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />{' '}
                                    {t('management.role.add')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<RoleItem, unknown>
                            columns={tableColumns}
                            rows={roles.data}
                            paginator={roles}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="name"
                            searchPlaceholder={t('nav.search.placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={t('management.role.empty')}
                        />
                    </CardContent>
                </Card>
            </div>

            <RoleUpsertDialog
                open={dialog.edit.open}
                role={dialog.edit.role}
                guards={guards}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setDialog((s) => ({
                            ...s,
                            edit: { ...s.edit, open: false },
                        }));
                    }
                }}
            />

            <PermissionsDialog
                open={dialog.perm.open}
                role={dialog.perm.role}
                permissions={permissions}
                preselected={dialog.perm.role?.permission_ids ?? []}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setDialog((s) => ({
                            ...s,
                            perm: { ...s.perm, open: false },
                        }));
                    }
                }}
            />

            <AlertDialog
                open={dialog.del.open}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setDialog((s) => ({
                            ...s,
                            del: { ...s.del, open: false },
                        }));
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('management.role.delete_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus role{' '}
                            <span className="font-medium">
                                {dialog.del.role?.name}
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex items-center justify-between gap-2">
                        <AlertDialogCancel className="mt-2 sm:mt-0">
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
