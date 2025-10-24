'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, ShieldCheck, Trash2 } from 'lucide-react';

import { Can } from '@/components/acl';
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
import i18n from '@/lib/i18n';
import type {
    RoleColumnOptions as ColumnFactoryOptions,
    RoleItem,
} from '@/types/management';

const COL = {
    name: 'shrink-0 w-[192px] md:w-[224px] lg:w-[248px]',
    guard: 'shrink-0 w-[108px] md:w-[124px]',
    users: 'shrink-0 w-[88px] md:w-[104px]',
    permissions: 'shrink-0 w-[136px] md:w-[156px]',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
};

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<RoleItem>[] => [
    makeColumn<RoleItem>({
        id: 'name',
        accessorKey: 'name',
        title: i18n.t('common.name'),
        className: COL.name,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.name + ' flex flex-col'}>
                <span className="font-medium">{row.original.name}</span>
                <span className="text-muted-foreground text-xs">
                    ID: {row.original.id}
                </span>
            </div>
        ),
    }),
    makeColumn<RoleItem>({
        id: 'guard_name',
        title: i18n.t('guard', { ns: 'role' }),
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
        title: i18n.t('common.users'),
        className: COL.users,
        sortable: true,
    }),
    makeColumn<RoleItem>({
        id: 'permissions',
        accessorKey: 'permissions_count',
        title: i18n.t('common.permissions'),
        className: COL.permissions,
        sortable: true,
    }),
    makeColumn<RoleItem>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: `${COL.actions} pr-2 md:pr-3 flex justify-end items-center`,
        cell: ({ row }) => (
            <div
                className={`${COL.actions} flex items-center justify-end pr-2 md:pr-3`}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${i18n.t('common.actions')} ${row.original.name}`}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>
                            {i18n.t('common.actions')}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Can all={['role.update']}>
                            <DropdownMenuItem
                                onClick={() => opts?.onEdit?.(row.original)}
                            >
                                <Pencil className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('actions.edit_role', { ns: 'role' })}
                            </DropdownMenuItem>
                        </Can>
                        <Can all={['role.permission.manage']}>
                            <DropdownMenuItem
                                onClick={() =>
                                    opts?.onPermissions?.(row.original)
                                }
                            >
                                <ShieldCheck className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('actions.manage_permissions', {
                                    ns: 'role',
                                })}
                            </DropdownMenuItem>
                        </Can>
                        <DropdownMenuSeparator />
                        <Can all={['role.delete']}>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => opts?.onDelete?.(row.original)}
                            >
                                <Trash2 className="text-destructive mr-2 h-4 w-4" />{' '}
                                {i18n.t('common.delete')}
                            </DropdownMenuItem>
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
    }),
];

export const columns: ColumnDef<RoleItem>[] = createColumns();
