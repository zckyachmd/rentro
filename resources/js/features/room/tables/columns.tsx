'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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
    RoomColumnOptions as ColumnFactoryOptions,
    RoomItem,
} from '@/types/management';

const COL = {
    number: 'shrink-0 w-[110px]',
    building: 'shrink-0 min-w-[140px] md:w-[180px] lg:w-[220px]',
    floor: 'shrink-0 w-[90px]',
    type: 'shrink-0 min-w-[120px] md:w-[160px]',
    status: 'shrink-0 w-[120px]',
    max: 'shrink-0 w-[80px] text-right',
    price: 'shrink-0 w-[140px] text-right',
    amenities: 'shrink-0 w-[90px] text-center',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
};

const statusColor: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    vacant: 'secondary',
    reserved: 'outline',
    occupied: 'default',
    maintenance: 'destructive',
    inactive: 'outline',
};

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<RoomItem>[] => [
    makeColumn<RoomItem>({
        id: 'number',
        accessorKey: 'number',
        title: i18n.t('common.number'),
        className: COL.number,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.number + ' flex flex-col'}>
                <button
                    type="button"
                    className="text-primary w-fit font-medium underline-offset-2 hover:underline focus:underline"
                    onClick={() => opts?.onDetail?.(row.original)}
                    aria-label={`${i18n.t('management.room.view_detail_aria')} ${row.original.number}`}
                >
                    {row.original.number}
                </button>
                {row.original.name && (
                    <span className="text-muted-foreground text-xs">
                        {row.original.name}
                    </span>
                )}
            </div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'building',
        title: i18n.t('common.building'),
        className: COL.building,
        cell: ({ row }) => (
            <div className={COL.building}>
                {row.original.building?.name ?? '-'}
            </div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'floor',
        title: i18n.t('common.floor'),
        className: COL.floor,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.floor}>
                {i18n.t('management.room.floor_prefix')}{' '}
                {row.original.floor?.level ?? '-'}
            </div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'type',
        title: i18n.t('common.type'),
        className: COL.type,
        cell: ({ row }) => (
            <div className={COL.type}>{row.original.type?.name ?? '-'}</div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'status',
        accessorKey: 'status',
        title: i18n.t('common.status'),
        className: COL.status,
        sortable: true,
        cell: ({ row }) => {
            const t = i18n;
            const st = (row.original.status || '').toLowerCase();
            return (
                <div className={COL.status}>
                    <Badge
                        variant={statusColor[st] ?? 'outline'}
                        className="capitalize"
                    >
                        {t.t(`room.status.${st}`, { defaultValue: row.original.status })}
                    </Badge>
                </div>
            );
        },
    }),
    makeColumn<RoomItem>({
        id: 'max_occupancy',
        accessorKey: 'max_occupancy',
        title: i18n.t('room.max_occupancy'),
        className: COL.max,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.max}>{getValue() as number}</div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'price',
        title: (() => {
            const t = i18n;
            const period =
                opts?.displayPeriod === 'daily'
                    ? t.t('common.daily')
                    : opts?.displayPeriod === 'weekly'
                      ? t.t('common.weekly')
                      : t.t('common.monthly');
            return `${t.t('common.price')} (${period})`;
        })(),
        className: COL.price,
        sortable: true,
        cell: ({ row }) => {
            const pDaily = row.original.price_daily_rupiah ?? '-';
            const pWeekly = row.original.price_weekly_rupiah ?? '-';
            const pMonthly = row.original.price_monthly_rupiah ?? '-';

            let show = pMonthly;
            if (opts?.displayPeriod === 'daily') show = pDaily;
            else if (opts?.displayPeriod === 'weekly') show = pWeekly;

            const t = i18n;
            const title = `${t.t('common.daily')}: ${pDaily}\n${t.t('common.weekly')}: ${pWeekly}\n${t.t('common.monthly')}: ${pMonthly}`;
            return (
                <div className={COL.price} title={title}>
                    {show}
                </div>
            );
        },
    }),
    makeColumn<RoomItem>({
        id: 'amenities',
        accessorKey: 'amenities_count',
        title: i18n.t('common.amenities'),
        className: COL.amenities,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.amenities}>{(getValue() as number) ?? 0}</div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => (
            <div className={COL.actions + ' flex items-center justify-end'}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${i18n.t('common.actions')} ${i18n.t('common.room')} ${row.original.number}`}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>
                            {i18n.t('common.actions')}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => opts?.onDetail?.(row.original)}
                        >
                            <Eye className="mr-2 h-4 w-4" />{' '}
                            {i18n.t('common.view_detail')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => opts?.onEdit?.(row.original)}
                        >
                            <Pencil className="mr-2 h-4 w-4" />{' '}
                            {i18n.t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => opts?.onDelete?.(row.original)}
                        >
                            <Trash2 className="text-destructive mr-2 h-4 w-4" />{' '}
                            {i18n.t('common.delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
    }),
];

export const columns: ColumnDef<RoomItem>[] = createColumns();
