import { router, usePage } from '@inertiajs/react';
import { Plus, RefreshCw } from 'lucide-react';
import React from 'react';

import type { Crumb } from '@/components/breadcrumbs';
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
import {
    DataTableServer,
    PaginatorMeta,
    type QueryBag,
} from '@/components/ui/data-table-server';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';

import { createColumns, type RoleItem } from './columns';
import PermissionsDialog, { Permission } from './permissions';
import RoleUpsertDialog from './role';

const BREADCRUMBS: Crumb[] = [
    { label: 'Management', href: '#' },
    { label: 'Roles' },
];

type RolePaginator = { data: RoleItem[] } & PaginatorMeta;

type PageProps = {
    [key: string]: unknown;
    roles: RolePaginator;
    permissions?: Permission[];
    query?: { guard?: string | null } & QueryBag;
};

export default function RolesIndex() {
    const { props } = usePage<PageProps>();
    const { roles, permissions = [], query } = props;

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const reload = React.useCallback(() => {
        router.reload({ preserveUrl: true });
    }, []);

    const [processing, setProcessing] = React.useState(false);

    const onStart = React.useCallback(() => setProcessing(true), []);
    const onFinish = React.useCallback(() => setProcessing(false), []);

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: roles,
        initial: query,
        currentPath,
        onStart,
        onFinish,
    });

    const [dialog, setDialog] = React.useState<{
        edit: { open: boolean; role: RoleItem | null };
        perm: { open: boolean; role: RoleItem | null };
        del: { open: boolean; role: RoleItem | null };
    }>({
        edit: { open: false, role: null },
        perm: { open: false, role: null },
        del: { open: false, role: null },
    });

    type dialogKey = keyof typeof dialog;

    const openDialog = React.useCallback(
        (key: dialogKey, role: RoleItem | null = null) =>
            setDialog((s) => ({ ...s, [key]: { open: true, role } })),
        [],
    );

    const actions = React.useMemo(
        () => ({
            toEdit: (role: RoleItem) => openDialog('edit', role),
            toPermissions: (role: RoleItem) => openDialog('perm', role),
            onDelete: (role: RoleItem) => openDialog('del', role),
        }),
        [openDialog],
    );

    const openCreate = React.useCallback(
        () => openDialog('edit', null),
        [openDialog],
    );

    const handleSearchChange = React.useCallback(
        (v: string) => {
            onQueryChange({ page: 1, search: v });
        },
        [onQueryChange],
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

    const columns = React.useMemo(() => createColumns(actions), [actions]);

    return (
        <AuthLayout
            pageTitle="Role Management"
            pageDescription="Kelola roles, hapus, dan atur permissions untuk akses aplikasi."
            breadcrumbs={BREADCRUMBS}
        >
            <div className="space-y-3">
                {/* Header & actions card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Daftar Role</CardTitle>
                        <CardDescription>
                            Kelola daftar role yang tersedia, termasuk menambah,
                            mengedit, menghapus, dan mengatur permissions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            {/* Left area (reserved for future filters) */}
                            <div className="flex w-full flex-1 items-center gap-2" />

                            {/* Right actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={reload}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" /> Muat
                                    ulang
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={openCreate}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Tambah Role
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table card */}
                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<RoleItem, unknown>
                            columns={columns}
                            rows={roles.data}
                            paginator={roles}
                            search={q.search}
                            onSearchChange={handleSearchChange}
                            searchKey="name"
                            searchPlaceholder="Cari nama role…"
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText="Tidak ada role."
                        />
                    </CardContent>
                </Card>
                <RoleUpsertDialog
                    open={dialog.edit.open}
                    role={dialog.edit.role}
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
                            <AlertDialogTitle>Hapus Role</AlertDialogTitle>
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
                                Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AuthLayout>
    );
}
