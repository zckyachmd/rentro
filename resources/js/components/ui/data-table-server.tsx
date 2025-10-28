"use client"

import type { ColumnDef, SortingState, OnChangeFn } from "@tanstack/react-table"
import * as React from "react"
import { useTranslation } from 'react-i18next'

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
  rightSlot?: React.ReactNode
  // page size options
  pageSizeOptions?: number[]
  // generic query dispatcher (page/per_page/q/sort/dir)
  onQueryChange: (next: { page?: number; per_page?: number; search?: string; sort?: string | null; dir?: 'asc' | 'desc' | null; [key: string]: unknown }) => void
  // sorting (server-side)
  sort?: string | null
  dir?: 'asc' | 'desc' | null
  onSortChange?: (next: { sort?: string | null; dir?: 'asc' | 'desc' | null }) => void
  // Auto refresh settings
  autoRefreshDefault?: 'off' | '5s' | '10s' | '15s' | '30s' | '1m' | '5m' | '10m'
  // UX
  loading?: boolean
  emptyText?: string
  // selection
  rowSelection?: boolean
  showSubmitButton?: boolean
  showColumn?: boolean
  showRefresh?: boolean
  onRowClick?: (row: TData) => void
}

export function DataTableServer<TData, TValue>({
  columns,
  rows,
  paginator,
  search = "",
  onSearchChange,
  searchKey = "email",
  searchPlaceholder,
  rightSlot,
  pageSizeOptions = [10, 20, 50, 100],
  onQueryChange,
  sort = null,
  dir = null,
  onSortChange,
  loading,
  emptyText,
  rowSelection = false,
  showSubmitButton = true,
  showColumn = true,
  autoRefreshDefault = 'off',
  showRefresh = false,
  onRowClick,
}: ServerDataTableProps<TData, TValue>) {
  const { t } = useTranslation()
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

  const allowAutoRefresh = !(showRefresh === false && autoRefreshDefault === 'off')
  const intervals: Record<string, number> = React.useMemo(() => ({
    off: 0,
    '5s': 5_000,
    '10s': 10_000,
    '15s': 15_000,
    '30s': 30_000,
    '1m': 60_000,
    '5m': 300_000,
    '10m': 600_000,
  }), [])

  const [refresh, setRefresh] = React.useState<keyof typeof intervals>(() => {
    if (!allowAutoRefresh) return 'off'
    try {
      const sp = new URLSearchParams(window.location.search)
      const v = sp.get('ar')
      const valid = v && Object.hasOwn(intervals, v)
      return (valid ? (v as keyof typeof intervals) : autoRefreshDefault)
    } catch { return autoRefreshDefault }
  })
  const refreshRef = React.useRef(refresh)
  React.useEffect(() => { refreshRef.current = refresh }, [refresh])
  // reflect auto refresh choice in URL query via onQueryChange (short param: ar)
  React.useEffect(() => {
    if (!allowAutoRefresh) return
    onQueryRef.current({ ar: String(refresh) })
  }, [refresh, allowAutoRefresh])

  const tick = React.useCallback(() => {
    if (document.visibilityState !== 'visible') return
    // Keep page, sort, dir, search
    onQueryRef.current({ page: meta.current_page, per_page: meta.per_page, search: search || undefined, sort, dir })
  }, [meta.current_page, meta.per_page, search, sort, dir])

  const intervalRef = React.useRef<number | null>(null)
  const setupInterval = React.useCallback(() => {
    if (!allowAutoRefresh) return
    // clear existing
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    const ms = intervals[String(refresh)] ?? 0
    if (!ms) return
    if (document.visibilityState !== 'visible') return
    intervalRef.current = window.setInterval(tick, ms)
  }, [refresh, intervals, tick, allowAutoRefresh])

  React.useEffect(() => {
    if (!allowAutoRefresh) return
    setupInterval()
    const onFocus = () => { setupInterval(); tick() }
    const onVisibility = () => { setupInterval() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [setupInterval, tick, allowAutoRefresh])

  return (
    <DataTable<TData, TValue>
      columns={columns}
      data={rows}
      pageSize={meta.per_page}
      onRowClick={onRowClick ? (row) => onRowClick(row.original as TData) : undefined}
      // manual sorting (server)
      sorting={sortingState}
      onSortingChange={handleSortingChange}
      // selection & UX
      enableRowSelection={rowSelection}
      loading={loading}
      emptyText={emptyText ?? t('datatable.no_data')}
      // toolbar
      renderToolbar={(table) => (
        <DataTableToolbar
          table={table}
          filterKey={searchKey}
          placeholder={searchPlaceholder ?? t('datatable.search_placeholder')}
          value={search}
          onValueChange={onSearchChange ?? noop}
          showSubmitButton={showSubmitButton}
          showColumn={showColumn}
          rightSlot={rightSlot}
          {...(showRefresh
            ? {
                autoRefreshValue: String(refresh),
                onAutoRefreshChange: (v: string) =>
                  setRefresh(v as keyof typeof intervals),
              }
            : {})}
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
