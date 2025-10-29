import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import { Filter, UserPlus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableServer } from '@/components/ui/data-table-server';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import CreateUserDialog from '@/pages/management/user/dialogs/create-user-dialog';
import ForceLogoutDialog from '@/pages/management/user/dialogs/force-logout-dialog';
import ResetPasswordDialog from '@/pages/management/user/dialogs/reset-password-dialog';
import { RoleDialog } from '@/pages/management/user/dialogs/role-dialog';
import { TwoFADialog } from '@/pages/management/user/dialogs/two-factor-dialog';
import { createColumns } from '@/pages/management/user/tables/columns';
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
    const { i18n, t } = useTranslation();
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

    const emailVerifiedValue: string =
        ((q as Record<string, unknown>).emailVerified as string | undefined) ||
        'all';
    const twofaValue: string =
        ((q as Record<string, unknown>).twofa as string | undefined) || 'all';
    const documentStatusValue: string =
        ((q as Record<string, unknown>).documentStatus as string | undefined) ||
        'all';

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
        <AppLayout
            pageTitle={tUser('title')}
            pageDescription={tUser('desc')}
            actions={
                <Can all={['user.create']}>
                    <Button size="sm" onClick={() => openDialog('create')}>
                        <UserPlus className="mr-2 h-4 w-4" /> {tUser('add')}
                    </Button>
                </Can>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Filter className="h-4 w-4" /> {t('common.filter')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {/* Role filter */}
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('common.role', 'Role')}
                                </Label>
                                <Select
                                    value={
                                        q.roleId != null
                                            ? String(q.roleId)
                                            : 'all'
                                    }
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            role_id:
                                                v === 'all' ? null : Number(v),
                                            roleId:
                                                v === 'all' ? null : Number(v),
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={tUser('all_roles')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {tUser('all_roles')}
                                        </SelectItem>
                                        {rolesOptions}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Email verified filter */}
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {tUser(
                                        'filter.email_verified',
                                        'Email Verified',
                                    )}
                                </Label>
                                <Select
                                    value={emailVerifiedValue}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            email_verified:
                                                v === 'all' ? null : v,
                                            emailVerified:
                                                v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('common.all', 'All')}
                                        </SelectItem>
                                        <SelectItem value="verified">
                                            {t('common.verified', 'Verified')}
                                        </SelectItem>
                                        <SelectItem value="unverified">
                                            {t(
                                                'common.unverified',
                                                'Unverified',
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Document status filter */}
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {tUser(
                                        'filter.document_status',
                                        'Document Status',
                                    )}
                                </Label>
                                <Select
                                    value={documentStatusValue}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            document_status:
                                                v === 'all' ? null : v,
                                            documentStatus:
                                                v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('common.all', 'All')}
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            {t('document.status.pending', {
                                                ns: 'enum',
                                                defaultValue: 'Pending',
                                            })}
                                        </SelectItem>
                                        <SelectItem value="approved">
                                            {t('document.status.approved', {
                                                ns: 'enum',
                                                defaultValue: 'Approved',
                                            })}
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                            {t('document.status.rejected', {
                                                ns: 'enum',
                                                defaultValue: 'Rejected',
                                            })}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 2FA filter */}
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {tUser('filter.twofa', 'Two-Factor Auth')}
                                </Label>
                                <Select
                                    value={twofaValue}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            twofa: v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('common.all', 'All')}
                                        </SelectItem>
                                        <SelectItem value="enabled">
                                            {t('security:enabled', 'Enabled')}
                                        </SelectItem>
                                        <SelectItem value="disabled">
                                            {t('security:disabled', 'Disabled')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
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
                    user={dialog.user as UserItem}
                    roles={roles}
                />
            )}

            {dialog.kind === 'reset' && dialog.user && (
                <ResetPasswordDialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    user={dialog.user as UserItem}
                />
            )}

            {dialog.kind === 'twofa' && dialog.user && (
                <TwoFADialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    user={dialog.user as UserItem}
                />
            )}

            {dialog.kind === 'revoke' && dialog.user && (
                <ForceLogoutDialog
                    open={dialog.open}
                    onOpenChange={(v) => setDialog((s) => ({ ...s, open: v }))}
                    user={dialog.user as UserItem}
                />
            )}
        </AppLayout>
    );
}
