import { router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import React from 'react';

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

import { createColumns } from './columns';
import PermissionsDialog, { Permission } from './permissions';
import RoleUpsertDialog from './roles';

export type RoleItem = {
    id: number;
    name: string;
    guard_name: string;
    users_count?: number;
    permissions_count?: number;
    permission_ids?: number[];
    created_at?: string;
    updated_at?: string;
};

type RoleDialogSlice = { open: boolean; role: RoleItem | null };

export type RoleDialogs = {
    edit: RoleDialogSlice;
    perm: RoleDialogSlice;
    del: RoleDialogSlice;
};

type DialogKey = keyof RoleDialogs;

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

    const tableColumns = React.useMemo(
        () =>
            createColumns({
                onEdit: (role: RoleItem) => openDialog('edit', role),
                onPermissions: (role: RoleItem) => openDialog('perm', role),
                onDelete: (role: RoleItem) => openDialog('del', role),
            }),
        [openDialog],
    );

    return (
        <AuthLayout
            pageTitle="Role Management"
            pageDescription="Kelola roles, hapus, dan atur permissions untuk akses aplikasi."
        >
            <div className="space-y-3">
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
                            <div className="flex w-full flex-1 items-center gap-2" />

                            <div className="flex items-center gap-2">
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
            </div>

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
        </AuthLayout>
    );
}
