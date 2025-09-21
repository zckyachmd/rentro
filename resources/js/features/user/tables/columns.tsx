'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
    KeyRound,
    LogOut,
    MoreHorizontal,
    ScanFace,
    ShieldCheck,
} from 'lucide-react';

import { Can } from '@/components/acl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { makeColumn } from '@/components/ui/data-table-column-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
    UserColumnOptions as ColumnFactoryOptions,
    UserItem,
} from '@/types/management';

const COL = {
    name: 'shrink-0 w-[180px] md:w-[260px] lg:w-[300px]',
    email: 'shrink-0 w-[180px] md:w-[260px] lg:w-[300px]',
    roles: 'shrink-0 w-[80px] md:w-[130px] lg:w-[170px]',
    twofa: 'shrink-0 w-[74px] md:w-[92px]',
    last: 'shrink-0 w-[86px] md:w-[100px]',
    actions: 'shrink-0 w-10 md:w-[48px]',
} as const;

// types moved to pages/types

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<UserItem>[] => [
    makeColumn<UserItem>({
        id: 'name',
        accessorKey: 'name',
        title: 'Nama',
        className: COL.name,
        sortable: true,
        cell: ({ row }) => {
            const u = row.original;
            return (
                <div className={`flex min-w-0 items-center gap-3 ${COL.name}`}>
                    <Avatar className="h-9 w-9">
                        {u.avatar ? (
                            <AvatarImage src={u.avatar} alt={u.name} />
                        ) : (
                            <AvatarFallback>
                                {(u.name?.slice(0, 1) ?? '?').toUpperCase()}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="min-w-0">
                        <div className="truncate font-medium">{u.name}</div>
                        {u.phone && (
                            <div className="truncate text-xs text-muted-foreground">
                                {u.phone}
                            </div>
                        )}
                    </div>
                    {/* Mobile details (shown when row expanded) */}
                    <div className="md:hidden">
                        {row.getIsExpanded() && (
                            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                <div>
                                    <span className="font-medium">Aktif:</span>{' '}
                                    {u.last_active_at ?? '—'}
                                </div>
                                <div>
                                    <span className="font-medium">2FA:</span>{' '}
                                    {u.two_factor_enabled
                                        ? 'Aktif'
                                        : 'Nonaktif'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        },
    }),
    makeColumn<UserItem>({
        id: 'email',
        accessorKey: 'email',
        title: 'Email',
        className: COL.email,
        sortable: true,
        cell: ({ row }) => {
            const u = row.original;
            return (
                <div className={`${COL.email} truncate`}>
                    <a
                        href={`mailto:${u.email}`}
                        className="block w-full truncate text-sm hover:underline"
                        title={u.email}
                    >
                        {u.email}
                    </a>
                </div>
            );
        },
    }),
    makeColumn<UserItem>({
        id: 'roles',
        accessorKey: 'roles',
        title: 'Peran',
        className: COL.roles,
        cell: ({ row }) => {
            const roles = row.original.roles || [];
            if (!roles.length) {
                return <Badge variant="outline">No Role</Badge>;
            }
            return (
                <div className={`${COL.roles} flex flex-wrap gap-1`}>
                    {roles.slice(0, 2).map((r) => (
                        <Badge key={r.id} variant="secondary">
                            {r.name}
                        </Badge>
                    ))}
                    {roles.length > 2 && (
                        <Badge variant="outline">
                            +{roles.length - 2} lainnya
                        </Badge>
                    )}
                </div>
            );
        },
    }),
    makeColumn<UserItem>({
        id: 'twofa',
        title: '2FA',
        className: COL.twofa,
        cell: ({ row }) => (
            <div className={COL.twofa}>
                <Badge
                    variant={
                        row.original.two_factor_enabled ? 'default' : 'outline'
                    }
                >
                    {row.original.two_factor_enabled ? 'Aktif' : 'Nonaktif'}
                </Badge>
            </div>
        ),
    }),
    makeColumn<UserItem>({
        id: 'last_active_at',
        title: 'Aktif Terakhir',
        className: COL.last,
        sortable: true,
        cell: ({ row }) => {
            const value = row.original.last_active_at;
            return <div className={`${COL.last} truncate`}>{value ?? '—'}</div>;
        },
    }),
    makeColumn<UserItem>({
        id: 'actions',
        title: 'Aksi',
        className: `text-right ${COL.actions}`,
        cell: ({ row }) => {
            const u = row.original;
            return (
                <div className={`text-right ${COL.actions}`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Aksi untuk ${u.name}`}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <Can all={['user.role.manage']}>
                                <DropdownMenuItem
                                    onClick={() => opts?.onManageRoles?.(u)}
                                >
                                    <ShieldCheck className="mr-2 h-4 w-4" />{' '}
                                    Kelola Peran
                                </DropdownMenuItem>
                            </Can>
                            <Can all={['user.password.reset']}>
                                <DropdownMenuItem
                                    onClick={() => opts?.onResetPassword?.(u)}
                                >
                                    <KeyRound className="mr-2 h-4 w-4" /> Reset
                                    Password
                                </DropdownMenuItem>
                            </Can>
                            {u.two_factor_enabled ? (
                                <Can all={['user.two-factor']}>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onTwoFARecovery?.(u)
                                        }
                                    >
                                        <ScanFace className="mr-2 h-4 w-4" />{' '}
                                        Kode Pemulihan 2FA
                                    </DropdownMenuItem>
                                </Can>
                            ) : null}
                            <DropdownMenuSeparator />
                            <Can all={['user.force-logout']}>
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => opts?.onRevokeSession?.(u)}
                                >
                                    <LogOut className="mr-2 h-4 w-4" /> Paksa
                                    Keluar
                                </DropdownMenuItem>
                            </Can>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<UserItem>[] = createColumns();
