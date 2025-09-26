"use client"

import type { Table } from "@tanstack/react-table"
import { useTranslation } from 'react-i18next'

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ServerMeta = {
  total: number
  from: number
  to: number
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
}

type Props<TData> = {
  table: Table<TData>
  pageSizeOptions?: number[]
  className?: string
  showPageIndicator?: boolean
  serverMeta?: ServerMeta
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  showPageIndicator = true,
  serverMeta,
}: Props<TData>) {
  const { t } = useTranslation()
  const useServer = !!serverMeta

  const canPrev = table.getCanPreviousPage()
  const canNext = table.getCanNextPage()
  const pageIndex = table.getState().pagination?.pageIndex ?? 0
  const pageSize = table.getState().pagination?.pageSize ?? pageSizeOptions[0]
  const displayPageSize = (serverMeta?.pageSize ?? pageSize)
  const pageCount = table.getPageCount?.() ?? 1
  const rowCount = table.getFilteredRowModel().rows.length

  const from = pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, rowCount)

  const sTotal = serverMeta?.total ?? rowCount
  const sFrom = serverMeta?.from ?? (rowCount === 0 ? 0 : from)
  const sTo = serverMeta?.to ?? (rowCount === 0 ? 0 : to)
  const sPageIndex = serverMeta ? serverMeta.currentPage - 1 : pageIndex
  const sPageCount = serverMeta ? serverMeta.lastPage : pageCount
  const sCanPrev = serverMeta ? serverMeta.currentPage > 1 : canPrev
  const sCanNext = serverMeta ? serverMeta.currentPage < (serverMeta.lastPage ?? 1) : canNext

  const PageSize = () => (
    <div className="hidden items-center gap-2 md:flex">
      <span className="hidden text-sm text-muted-foreground md:inline">{t('datatable.per_page')}</span>
      <Select value={String(displayPageSize)} onValueChange={(v) => {
        const n = Number(v)
        if (useServer && serverMeta?.onPageSizeChange) {
          serverMeta.onPageSizeChange(n)
        } else {
          table.setPageSize(n)
        }
      }}>
        <SelectTrigger aria-label={t('datatable.per_page')} className="w-[84px] justify-between">
          <SelectValue placeholder={t('datatable.per_page')} />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className={`flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-between ${className ?? ""}`}>
      <div className="text-sm text-muted-foreground">
        {t('datatable.showing', { from: sFrom, to: sTo, total: sTotal })}
      </div>

      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          {showPageIndicator && (
            <div className="px-2 text-sm tabular-nums">
              {t('datatable.page_indicator', { current: sPageIndex + 1, total: Math.max(1, sPageCount) })}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => (useServer ? serverMeta!.onPageChange(serverMeta!.currentPage - 1) : table.previousPage())}
            disabled={!sCanPrev}
          >
            {t('datatable.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (useServer ? serverMeta!.onPageChange(serverMeta!.currentPage + 1) : table.nextPage())}
            disabled={!sCanNext}
          >
            {t('datatable.next')}
          </Button>
        </div>
        <div className="hidden h-6 w-px bg-border md:mx-3 md:block" />
        <div className="md:ml-auto">
          <PageSize />
        </div>
      </div>
    </div>
  )
}
