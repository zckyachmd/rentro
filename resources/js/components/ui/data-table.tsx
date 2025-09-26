"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type OnChangeFn,
  type Table as TanTable,
} from "@tanstack/react-table"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useTranslation } from 'react-i18next'

import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  renderToolbar?: (table: TanTable<TData>) => React.ReactNode
  renderFooter?: (table: TanTable<TData>) => React.ReactNode
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  loading?: boolean
  emptyText?: string
  enableRowSelection?: boolean
  showSelectedCount?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 20,
  renderToolbar,
  renderFooter,
  sorting,
  onSortingChange,
  loading = false,
  emptyText,
  enableRowSelection = false,
  showSelectedCount = true,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation()
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize })

  const computedColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns
    const selectCol: ColumnDef<TData, unknown> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label={t('datatable.select_all')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={t('datatable.select_row')}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32,
    }
    return [selectCol, ...columns]
  }, [columns, enableRowSelection, t])

  const table = useReactTable({
    data,
    columns: computedColumns,
    state: { columnFilters, pagination, sorting },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onSortingChange,
    manualSorting: !!onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection,
  })

  const SelectedInfo = () => {
    if (!enableRowSelection || !showSelectedCount) return null
    const selected = table.getFilteredSelectedRowModel().rows.length
    const total = table.getFilteredRowModel().rows.length
    if (total === 0) return null
    return (
      <div className="text-xs text-muted-foreground">{selected} dari {total} baris dipilih</div>
    )
  }

  return (
    <div className="space-y-3">
      {renderToolbar ? (
        renderToolbar(table)
      ) : (
        enableRowSelection && (
          <div className="flex items-center justify-end">
            <SelectedInfo />
          </div>
        )
      )}

      <div className="overflow-hidden rounded-md border">
        <Table className="table-auto w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="h-24" colSpan={computedColumns.length}>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('datatable.loading')}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={computedColumns.length}>
                  {emptyText ?? t('datatable.no_data')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {renderFooter?.(table)}
    </div>
  )
}
