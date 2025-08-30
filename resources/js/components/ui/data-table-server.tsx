"use client"

import type { ColumnDef, SortingState, OnChangeFn } from "@tanstack/react-table"
import * as React from "react"

import { DataTable } from "@/components/ui/data-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"

export type PaginatorMeta = {
  total: number
  from: number | null
  to: number | null
  current_page: number
  last_page: number
  per_page: number
}

export type QueryBag = {
    page?: number;
    perPage?: number;
    sort?: string | null;
    dir?: 'asc' | 'desc' | null;
    search?: string | null;
};

type ServerDataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  rows: TData[]
  paginator?: PaginatorMeta | null
  // controlled search (server-mode)
  search?: string
  onSearchChange?: (q: string) => void
  searchKey?: string
  searchPlaceholder?: string
  // page size options
  pageSizeOptions?: number[]
  // generic query dispatcher (page/per_page/q/sort/dir)
  onQueryChange: (next: { page?: number; per_page?: number; search?: string; sort?: string | null; dir?: 'asc' | 'desc' | null }) => void
  // sorting (server-side)
  sort?: string | null
  dir?: 'asc' | 'desc' | null
  onSortChange?: (next: { sort?: string | null; dir?: 'asc' | 'desc' | null }) => void
  // UX
  loading?: boolean
  emptyText?: string
  // selection
  rowSelection?: boolean
  showSubmitButton?: boolean
  showColumn?: boolean
}

export function DataTableServer<TData, TValue>({
  columns,
  rows,
  paginator,
  search = "",
  onSearchChange,
  searchKey = "email",
  searchPlaceholder = "Cari …",
  pageSizeOptions = [10, 20, 50, 100],
  onQueryChange,
  sort = null,
  dir = null,
  onSortChange,
  loading,
  emptyText = "Tidak ada data.",
  rowSelection = false,
  showSubmitButton = true,
  showColumn = true
}: ServerDataTableProps<TData, TValue>) {
  const meta: PaginatorMeta = React.useMemo(() => (
    paginator ?? {
      total: 0,
      from: 0,
      to: 0,
      current_page: 1,
      last_page: 1,
      per_page: 20,
    }
  ), [paginator])

  const noop = React.useCallback(() => {}, [])

  const onQueryRef = React.useRef(onQueryChange)
  React.useEffect(() => {
    onQueryRef.current = onQueryChange
  }, [onQueryChange])

  React.useEffect(() => {
    if (showSubmitButton) return
    const id = window.setTimeout(() => {
      onQueryRef.current({ page: 1, search: search || undefined, sort, dir })
    }, 300)
    return () => window.clearTimeout(id)
  }, [search, sort, dir, showSubmitButton])

  const sortingState: SortingState = React.useMemo(() => {
    return sort ? [{ id: sort, desc: dir === 'desc' }] : []
  }, [sort, dir])

  const handleSortingChange = React.useCallback<OnChangeFn<SortingState>>((updater) => {
    const next = typeof updater === 'function' ? updater(sortingState) : updater
    const s = next[0]
    onSortChange?.({ sort: s?.id ?? null, dir: s ? (s.desc ? 'desc' : 'asc') : null })
  }, [sortingState, onSortChange])

  const onPageChange = React.useCallback((page: number) => {
    onQueryChange({ page, search: search || undefined, sort, dir })
  }, [onQueryChange, search, sort, dir])

  const onPageSizeChange = React.useCallback((size: number) => {
    onQueryChange({ page: 1, per_page: size, search: search || undefined, sort, dir })
  }, [onQueryChange, search, sort, dir])

  const serverMeta = React.useMemo(() => ({
    total: meta.total,
    from: meta.from ?? 0,
    to: meta.to ?? 0,
    currentPage: meta.current_page,
    lastPage: meta.last_page,
    pageSize: meta.per_page,
    onPageChange,
    onPageSizeChange,
  }), [meta.total, meta.from, meta.to, meta.current_page, meta.last_page, meta.per_page, onPageChange, onPageSizeChange])

  return (
    <DataTable<TData, TValue>
      columns={columns}
      data={rows}
      pageSize={meta.per_page}
      // manual sorting (server)
      sorting={sortingState}
      onSortingChange={handleSortingChange}
      // selection & UX
      enableRowSelection={rowSelection}
      loading={loading}
      emptyText={emptyText}
      // toolbar
      renderToolbar={(table) => (
        <DataTableToolbar
          table={table}
          filterKey={searchKey}
          placeholder={searchPlaceholder}
          value={search}
          onValueChange={onSearchChange ?? noop}
          showSubmitButton={showSubmitButton}
          showColumn={showColumn}
        />
      )}
      // footer
      renderFooter={(table) => (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          serverMeta={serverMeta}
        />
      )}
    />
  )
}
