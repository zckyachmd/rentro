import { Head, router, usePage } from '@inertiajs/react';
import { RefreshCw, UserPlus } from 'lucide-react';
import React from 'react';

import type { Crumb } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { PaginatorMeta } from '@/components/ui/data-table-server';
import { DataTableServer } from '@/components/ui/data-table-server';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AuthLayout from '@/layouts/auth-layout';

import { createColumns } from './columns';
import ForceLogoutDialog from './force-logout';
import ResetPasswordDialog from './reset-password';
import { Role, RoleDialog } from './role';
import { TwoFADialog } from './two-factor';

const BREADCRUMBS: Crumb[] = [
    { label: 'Administrasi', href: '#' },
    { label: 'Akses & Peran', href: '#' },
    { label: 'Pengguna' },
];

export type UserRow = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    roles: Role[];
    two_factor_enabled: boolean;
    last_active_at?: string | null;
    initials?: string | null;
};

type UsersPaginator = { data: UserRow[] } & PaginatorMeta;

type QueryBag = {
    page?: number;
    perPage?: number;
    sort?: string | null;
    dir?: 'asc' | 'desc' | null;
    search?: string | null;
    roleId?: number | null;
};

type PageProps = {
    users?: UsersPaginator;
    roles?: Role[];
    query?: QueryBag;
};

type QueryState = {
    page: number;
    perPage: number;
    search: string;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    roleId: number | null;
};

type DialogKind = 'role' | 'reset' | 'twofa' | 'revoke';

type DialogState = {
    kind: DialogKind | null;
    open: boolean;
    saving: boolean;
    user: UserRow | (UserRow & { two_factor_enabled?: boolean }) | null;
};

const computeInitials = (name?: string | null) =>
    (name?.slice(0, 1) ?? '?').toUpperCase();

export default function UsersIndex() {
    const { props } = usePage<PageProps>();
    const roles: Role[] = React.useMemo(() => props.roles ?? [], [props.roles]);
    const paginator = props.users;
    const rows: UserRow[] = React.useMemo(
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

    const reload = React.useCallback(() => {
        router.reload({ preserveUrl: true });
    }, []);

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

    const q: QueryState = React.useMemo(
        () => ({
            page: props.query?.page ?? paginator?.current_page ?? 1,
            perPage: props.query?.perPage ?? paginator?.per_page ?? 20,
            search: props.query?.search ?? '',
            sort: props.query?.sort ?? null,
            dir: props.query?.dir ?? null,
            roleId: props.query?.roleId ?? null,
        }),
        [props.query, paginator?.current_page, paginator?.per_page],
    );

    const { page, perPage, search, sort, dir, roleId } = q;

    const onQueryChange = React.useCallback(
        (next: {
            page?: number;
            per_page?: number;
            search?: string;
            sort?: string | null;
            dir?: 'asc' | 'desc' | null;
            role_id?: number | undefined;
        }) => {
            const nextPage = next.page ?? page;
            const nextPerPage = next.per_page ?? perPage;
            const nextSearch = next.search ?? (search || undefined);
            const nextSort = next.sort ?? sort ?? undefined;
            const nextDir = next.dir ?? dir ?? undefined;
            const nextRole =
                next.role_id ?? (roleId !== null ? roleId : undefined);

            const same =
                Number(page) === Number(nextPage) &&
                Number(perPage) === Number(nextPerPage) &&
                (search || undefined) === nextSearch &&
                (sort ?? undefined) === nextSort &&
                (dir ?? undefined) === nextDir &&
                (roleId ?? undefined) === nextRole;
            if (same) return;

            router.get(
                currentPath,
                {
                    page: nextPage,
                    per_page: nextPerPage,
                    search: nextSearch,
                    sort: nextSort,
                    dir: nextDir,
                    role_id: nextRole,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onStart: () => setProcessing(true),
                    onFinish: () => setProcessing(false),
                },
            );
        },
        [page, perPage, search, sort, dir, roleId, currentPath],
    );

    const handleSortChange = React.useCallback(
        ({
            sort: s,
            dir: d,
        }: {
            sort?: string | null;
            dir?: 'asc' | 'desc' | null;
        }) => {
            onQueryChange({ page: 1, sort: s ?? null, dir: d ?? null });
        },
        [onQueryChange],
    );

    const openDialog = React.useCallback(
        (kind: DialogKind, u?: UserRow) => {
            const pick = u ?? rows[0];
            if (!pick) return;
            setDialog({ kind, open: true, saving: false, user: pick });
        },
        [rows],
    );

    const tableColumns = React.useMemo(
        () =>
            createColumns({
                onManageRoles: (u) => openDialog('role', u),
                onResetPassword: (u) => openDialog('reset', u),
                onTwoFARecovery: (u) => openDialog('twofa', u),
                onRevokeSession: (u) => openDialog('revoke', u),
            }),
        [openDialog],
    );

    return (
        <AuthLayout
            pageTitle="Pengguna"
            pageDescription="Kelola akun, peran, keamanan, dan sesi login"
            breadcrumbs={BREADCRUMBS}
        >
            <Head title="Pengguna" />

            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Pengelolaan Pengguna</CardTitle>
                        <CardDescription>
                            Tambah pengguna, atur peran, reset password, 2FA,
                            dan sesi aktif.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                <Select
                                    value={q.roleId ? String(q.roleId) : 'all'}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            role_id:
                                                v === 'all'
                                                    ? undefined
                                                    : Number(v),
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Semua peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua peran
                                        </SelectItem>
                                        {rolesOptions}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={reload}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" /> Muat
                                    ulang
                                </Button>
                                <Button size="sm">
                                    <UserPlus className="mr-2 h-4 w-4" /> Tambah
                                    Pengguna
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<UserRow, unknown>
                            columns={tableColumns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="email"
                            searchPlaceholder="Cari nama/email/telepon…"
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText="Tidak ada pengguna."
                        />
                    </CardContent>
                </Card>
            </div>

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
