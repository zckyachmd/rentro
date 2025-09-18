'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, ShieldCheck, Trash2 } from 'lucide-react';

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
    RoleColumnOptions as ColumnFactoryOptions,
    RoleItem,
} from '@/types/management';

const COL = {
    name: 'shrink-0 w-[180px] md:w-[260px] lg:w-[300px]',
    guard: 'shrink-0 w-[100px] md:w-[120px]',
    users: 'shrink-0 w-[64px] md:w-[80px] text-right',
    permissions: 'shrink-0 w-[80px] md:w-[100px] text-right',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
};

// types moved to pages/types

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<RoleItem>[] => [
    makeColumn<RoleItem>({
        id: 'name',
        accessorKey: 'name',
        title: 'Nama',
        className: COL.name,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.name + ' flex flex-col'}>
                <span className="font-medium">{row.original.name}</span>
                <span className="text-xs text-muted-foreground">
                    ID: {row.original.id}
                </span>
            </div>
        ),
    }),
    makeColumn<RoleItem>({
        id: 'guard_name',
        title: 'Guard',
        className: COL.guard,
        cell: ({ getValue }) => (
            <div className={COL.guard}>
                <Badge variant="secondary">
                    {(getValue() as string) || 'web'}
                </Badge>
            </div>
        ),
    }),
    makeColumn<RoleItem>({
        id: 'users',
        accessorKey: 'users_count',
        title: 'Pengguna',
        className: COL.users,
        sortable: true,
    }),
    makeColumn<RoleItem>({
        id: 'permissions',
        accessorKey: 'permissions_count',
        title: 'Permissions',
        className: COL.permissions,
        sortable: true,
    }),
    makeColumn<RoleItem>({
        id: 'actions',
        title: 'Aksi',
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => (
            <div className={COL.actions + ' flex items-center justify-end'}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Aksi untuk ${row.original.name}`}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => opts?.onPermissions?.(row.original)}
                        >
                            <ShieldCheck className="mr-2 h-4 w-4" /> Kelola
                            permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => opts?.onEdit?.(row.original)}
                        >
                            <Pencil className="mr-2 h-4 w-4" /> Edit role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => opts?.onDelete?.(row.original)}
                        >
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />{' '}
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
    }),
];

export const columns: ColumnDef<RoleItem>[] = createColumns();
