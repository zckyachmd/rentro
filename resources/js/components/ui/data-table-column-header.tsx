"use client"


import type { Column, ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"

type HeaderColumn = Column<unknown, unknown>

type Props = {
  column: HeaderColumn
  title: string
}

export function DataTableColumnHeader({ column, title }: Props) {
  const sorted = column.getIsSorted()
  const canSort = column.getCanSort?.() ?? false

  if (!canSort) {
    return (
      <div
        className="inline-flex h-8 items-center font-medium cursor-default select-text"
        aria-sort="none"
      >
        {title}
      </div>
    )
  }

  const isAsc = sorted === "asc"
  const isDesc = sorted === "desc"
  const nextDir = isAsc ? "desc" : "asc"

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => column.toggleSorting(isAsc)}
      className="h-8 px-0"
      aria-label={`Urutkan ${title} ${nextDir}`}
      aria-sort={isAsc ? "ascending" : isDesc ? "descending" : "none"}
      data-state={sorted || "none"}
    >
      {title}
      {sorted === false && <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden />}
      {sorted === "asc" && <ArrowUp className="ml-2 h-4 w-4" aria-hidden />}
      {sorted === "desc" && <ArrowDown className="ml-2 h-4 w-4" aria-hidden />}
    </Button>
  )
}

type MakeColumnOptions<TData> = {
  id: string
  accessorKey?: string
  title?: string
  className?: string
  headerClassName?: string
  cellClassName?: string
  sortable?: boolean
  cell?: ColumnDef<TData>["cell"]
  meta?: Record<string, unknown>
}

function humanize(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function makeColumn<TData>({
  id,
  accessorKey,
  title,
  className = "",
  headerClassName,
  cellClassName,
  sortable = false,
  cell,
  meta,
}: MakeColumnOptions<TData>): ColumnDef<TData> {
  const _accessor = accessorKey ?? id
  const _title = title ?? humanize(id)
  const headerCls = headerClassName ?? className ?? ''
  const cellCls = cellClassName ?? className ?? ''

  return {
    id,
    accessorKey: _accessor,
    header: ({ column }) => (
      <div className={headerCls}>
        <DataTableColumnHeader column={column as HeaderColumn} title={_title} />
      </div>
    ),
    cell:
      cell ??
      (({ getValue }) => (
        <div className={cellCls}>{String(getValue() ?? "")}</div>
      )),
    enableSorting: sortable,
    meta: { label: _title, ...meta },
  }
}
