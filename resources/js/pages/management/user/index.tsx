import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
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
import CreateUserDialog from '@/features/user/dialogs/create-user-dialog';
import ForceLogoutDialog from '@/features/user/dialogs/force-logout-dialog';
import ResetPasswordDialog from '@/features/user/dialogs/reset-password-dialog';
import { RoleDialog } from '@/features/user/dialogs/role-dialog';
import { TwoFADialog } from '@/features/user/dialogs/two-factor-dialog';
import { createColumns } from '@/features/user/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import type {
    UserDialogKind as DialogKind,
    UserDialogState as DialogState,
    UserIndexPageProps as PageProps,
    Role,
    UserItem,
} from '@/types/management';

const computeInitials = (name?: string | null) =>
    (name?.slice(0, 1) ?? '?').toUpperCase();

export default function UsersIndex() {
    const { i18n } = useTranslation();
    const { t: tUser } = useTranslation('management/user');
    const { props } = usePage<InertiaPageProps & PageProps>();
    const roles: Role[] = React.useMemo(() => props.roles ?? [], [props.roles]);
    const paginator = props.users;

    const rows: UserItem[] = React.useMemo(
        () =>
            (paginator?.data ?? []).map((u) => ({
                ...u,
                initials: computeInitials(u.name),
            })),
        [paginator?.data],
    );

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const rolesOptions = React.useMemo(
        () =>
            roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                </SelectItem>
            )),
        [roles],
    );

    const [processing, setProcessing] = React.useState(false);

    const [dialog, setDialog] = React.useState<DialogState>({
        kind: null,
        open: false,
        saving: false,
        user: null,
    });

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: paginator ?? null,
        initial: props.query,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const openDialog = React.useCallback(
        (kind: DialogKind, u?: UserItem | null) => {
            if (kind !== 'create') {
                const pick = u ?? rows[0];
                if (!pick) return;
                setDialog({ kind, open: true, saving: false, user: pick });
                return;
            }
            setDialog({ kind, open: true, saving: false, user: null });
        },
        [rows],
    );

    const lang = i18n.language;
    const tableColumns = React.useMemo(() => {
        void lang;
        return createColumns({
            onManageRoles: (u) => openDialog('role', u),
            onResetPassword: (u) => openDialog('reset', u),
            onTwoFARecovery: (u) => openDialog('twofa', u),
            onRevokeSession: (u) => openDialog('revoke', u),
        });
    }, [openDialog, lang]);

    return (
        <AuthLayout pageTitle={tUser('title')} pageDescription={tUser('desc')}>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>{tUser('title')}</CardTitle>
                        <CardDescription>
                            {tUser('desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                <Select
                                    value={
                                        q.roleId !== null
                                            ? String(q.roleId)
                                            : 'all'
                                    }
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            role_id:
                                                v === 'all' ? null : Number(v),
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder={tUser('all_roles')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {tUser('all_roles')}
                                        </SelectItem>
                                        {rolesOptions}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Can all={['user.create']}>
                                    <Button
                                        size="sm"
                                        onClick={() => openDialog('create')}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />{' '}
                                        {tUser('add')}
                                    </Button>
                                </Can>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<UserItem, unknown>
                            columns={tableColumns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="email"
                            searchPlaceholder={tUser('search_placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tUser('empty')}
                        />
                    </CardContent>
                </Card>
            </div>

            {dialog.kind === 'create' && (
                <CreateUserDialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    roles={roles}
                />
            )}

            {dialog.kind === 'role' && dialog.user && (
                <RoleDialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    user={dialog.user}
                    roles={roles}
                />
            )}

            {dialog.kind === 'reset' && dialog.user && (
                <ResetPasswordDialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    user={dialog.user}
                />
            )}

            {dialog.kind === 'twofa' && dialog.user && (
                <TwoFADialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    user={dialog.user}
                />
            )}

            {dialog.kind === 'revoke' && dialog.user && (
                <ForceLogoutDialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    user={dialog.user}
                />
            )}
        </AuthLayout>
    );
}
