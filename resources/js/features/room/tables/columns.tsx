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
        title: 'Nomor',
        className: COL.number,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.number + ' flex flex-col'}>
                <button
                    type="button"
                    className="w-fit font-medium text-primary underline-offset-2 hover:underline focus:underline"
                    onClick={() => opts?.onDetail?.(row.original)}
                    aria-label={`Lihat detail kamar ${row.original.number}`}
                >
                    {row.original.number}
                </button>
                {row.original.name && (
                    <span className="text-xs text-muted-foreground">
                        {row.original.name}
                    </span>
                )}
            </div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'building',
        title: 'Gedung',
        className: COL.building,
        cell: ({ row }) => (
            <div className={COL.building}>
                {row.original.building?.name ?? '-'}
            </div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'floor',
        title: 'Lantai',
        className: COL.floor,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.floor}>
                Lt {row.original.floor?.level ?? '-'}
            </div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'type',
        title: 'Tipe',
        className: COL.type,
        cell: ({ row }) => (
            <div className={COL.type}>{row.original.type?.name ?? '-'}</div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'status',
        accessorKey: 'status',
        title: 'Status',
        className: COL.status,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.status}>
                <Badge
                    variant={statusColor[row.original.status] ?? 'outline'}
                    className="capitalize"
                >
                    {row.original.status}
                </Badge>
            </div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'max_occupancy',
        accessorKey: 'max_occupancy',
        title: 'Max',
        className: COL.max,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.max}>{getValue() as number}</div>
        ),
    }),
    makeColumn<RoomItem>({
        id: 'price',
        title: (() => {
            const label =
                opts?.displayPeriod === 'daily'
                    ? 'Harian'
                    : opts?.displayPeriod === 'weekly'
                      ? 'Mingguan'
                      : 'Bulanan';
            return `Harga  ${label}`;
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

            const title = `Harian: ${pDaily}\nMingguan: ${pWeekly}\nBulanan: ${pMonthly}`;
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
        title: 'Fasilitas',
        className: COL.amenities,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.amenities}>{(getValue() as number) ?? 0}</div>
        ),
    }),
    makeColumn<RoomItem>({
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
                            aria-label={`Aksi untuk kamar ${row.original.number}`}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => opts?.onDetail?.(row.original)}
                        >
                            <Eye className="mr-2 h-4 w-4" /> Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => opts?.onEdit?.(row.original)}
                        >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
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

export const columns: ColumnDef<RoomItem>[] = createColumns();
