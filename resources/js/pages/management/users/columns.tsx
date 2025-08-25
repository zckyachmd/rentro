'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
    KeyRound,
    LogOut,
    MoreHorizontal,
    ScanFace,
    ShieldCheck,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { UserRow } from '.';

const COL = {
    name: 'shrink-0 w-[180px] md:w-[260px] lg:w-[300px]',
    email: 'shrink-0 w-[180px] md:w-[260px] lg:w-[300px]',
    roles: 'shrink-0 w-[80px] md:w-[130px] lg:w-[170px]',
    twofa: 'shrink-0 w-[74px] md:w-[92px]',
    last: 'shrink-0 w-[86px] md:w-[100px]',
    actions: 'shrink-0 w-10 md:w-[48px]',
} as const;

export type ManageRolesHandler = (user: UserRow) => void;
export type ResetPasswordHandler = (user: UserRow) => void;
export type ColumnFactoryOptions = {
    onManageRoles?: ManageRolesHandler;
    onResetPassword?: ResetPasswordHandler;
    onTwoFARecovery?: (user: UserRow) => void;
    onRevokeSession?: (user: UserRow) => void;
};

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<UserRow>[] => [
    {
        accessorKey: 'name',
        meta: { label: 'Nama' },
        header: ({ column }) => (
            <div className={COL.name}>
                <DataTableColumnHeader column={column} title="Nama" />
            </div>
        ),
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
    },
    {
        accessorKey: 'email',
        meta: { label: 'Email' },
        header: ({ column }) => (
            <div className={COL.email}>
                <DataTableColumnHeader column={column} title="Email" />
            </div>
        ),
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
    },
    {
        id: 'roles',
        meta: { label: 'Peran' },
        header: () => <div className={COL.roles}>Peran</div>,
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
    },
    {
        id: 'twofa',
        meta: { label: '2FA' },
        header: () => <div className={COL.twofa}>2FA</div>,
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
    },
    {
        accessorKey: 'last_active_at',
        meta: { label: 'Aktif Terakhir' },
        header: ({ column }) => (
            <div className={COL.last}>
                <DataTableColumnHeader column={column} title="Aktif Terakhir" />
            </div>
        ),
        cell: ({ row }) => {
            const value = row.original.last_active_at;
            return <div className={`${COL.last} truncate`}>{value ?? '—'}</div>;
        },
    },
    {
        id: 'actions',
        meta: { label: 'Aksi' },
        header: () => <div className={`text-right ${COL.actions}`}>Aksi</div>,
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
                            <DropdownMenuItem
                                onClick={() => opts?.onManageRoles?.(u)}
                            >
                                <ShieldCheck className="mr-2 h-4 w-4" /> Kelola
                                Peran
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => opts?.onResetPassword?.(u)}
                            >
                                <KeyRound className="mr-2 h-4 w-4" /> Reset
                                Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => opts?.onTwoFARecovery?.(u)}
                            >
                                <ScanFace className="mr-2 h-4 w-4" /> Kode
                                Pemulihan 2FA
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => opts?.onRevokeSession?.(u)}
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Paksa Keluar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];

export const columns: ColumnDef<UserRow>[] = createColumns();
