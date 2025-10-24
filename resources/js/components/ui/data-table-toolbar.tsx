"use client"

import type { Column, Table } from "@tanstack/react-table"
import { ChevronDown, Search } from "lucide-react"
import * as React from "react"
import { useTranslation } from 'react-i18next'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

type Props<TData> = {
  table: Table<TData>
  filterKey?: string
  placeholder?: string
  rightSlot?: React.ReactNode
  debounceMs?: number
  value?: string
  onValueChange?: (v: string) => void
  showSubmitButton?: boolean
  toggleableColumnIds?: string[]
  storageKey?: string
  columnsButtonLabel?: string
  showColumn?: boolean
  autoRefreshValue?: string
  onAutoRefreshChange?: (v: string) => void
}

const resolveColumnLabel = <TData,>(col: Column<TData, unknown>): string => {
  const header = col?.columnDef?.header
  if (typeof header === 'string' && header.trim()) return header

  const metaLabel = (col?.columnDef?.meta as { label?: string } | undefined)?.label
  if (typeof metaLabel === 'string' && metaLabel.trim()) return metaLabel

  const id: string = String(col?.id ?? '')
  const pretty = id
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
  return pretty || id
}

export function DataTableToolbar<TData>({
  table,
  filterKey = "email",
  placeholder,
  rightSlot,
  debounceMs = 300,
  value: controlledValue,
  onValueChange,
  showSubmitButton = false,
  toggleableColumnIds,
  storageKey,
  columnsButtonLabel,
  showColumn = true,
  autoRefreshValue,
  onAutoRefreshChange,
}: Props<TData>) {
  const { t } = useTranslation()
  const column = (table.getAllLeafColumns() as Column<TData, unknown>[]).find(
    (c) => String(c.id) === String(filterKey)
  ) as Column<TData, unknown> | undefined
  const visibility = table.getState?.().columnVisibility as Record<string, boolean> | undefined
  const allLeaf = table.getAllLeafColumns() as Column<TData, unknown>[]

  const toggleable = React.useMemo(() => {
    const base = allLeaf.filter((c) => c.getCanHide?.())
    if (!Array.isArray(toggleableColumnIds) || toggleableColumnIds.length === 0) return base
    const set = new Set(toggleableColumnIds)
    return base.filter((c) => set.has(String(c.id)))
  }, [allLeaf, toggleableColumnIds])

  React.useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const vis = JSON.parse(raw) as Record<string, boolean>
      (table.getAllLeafColumns() as Column<TData, unknown>[]).forEach((c) => {
        if (Object.prototype.hasOwnProperty.call(vis, String(c.id))) {
          c.toggleVisibility(!!vis[String(c.id)])
        }
      })
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  React.useEffect(() => {
    if (!storageKey || !visibility) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibility))
    } catch { /* ignore */ }
  }, [storageKey, visibility])

  const setAllVisibility = (v: boolean) => {
    toggleable.forEach((c) => c.toggleVisibility(v))
  }

  const isControlled = typeof onValueChange === 'function'

  const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(() => (column?.getFilterValue() as string) ?? "")
  const value = isControlled ? (controlledValue ?? "") : uncontrolledValue
  const debouncedRef = React.useRef<number | null>(null)
  const [draft, setDraft] = React.useState<string>(controlledValue ?? "")

  React.useEffect(() => {
    if (!showSubmitButton) return
    setDraft(controlledValue ?? "")
  }, [controlledValue, showSubmitButton])

  const onChange = (next: string) => {
    if (showSubmitButton) {
      if (isControlled) {
        setDraft(next)
      } else {
        setUncontrolledValue(next)
      }
      return
    }

    if (isControlled && onValueChange) {
      onValueChange(next)
      return
    }

    setUncontrolledValue(next)
    if (!column) return
    if (debouncedRef.current) window.clearTimeout(debouncedRef.current)
    debouncedRef.current = window.setTimeout(() => {
      column.setFilterValue(next)
    }, debounceMs)
  }

  const submitSearch = () => {
    const term = (isControlled ? draft : uncontrolledValue).trim()
    if (isControlled && onValueChange) {
      onValueChange(term)
      return
    }
    if (!column) return
    column.setFilterValue(term || undefined)
  }

  const placeholderText = placeholder ?? t('datatable.search_placeholder')

  return (
    <div className="flex flex-col gap-2 py-2 md:flex-row md:items-center md:gap-3 min-w-0">
      {column && (
        <>
          <Input
            value={showSubmitButton && isControlled ? draft : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholderText}
            className="w-full md:max-w-xs"
            onKeyDown={showSubmitButton ? (e) => { if (e.key === 'Enter') submitSearch() } : undefined}
          />
          {showSubmitButton && (
            <div className="flex flex-col items-start">
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={submitSearch} className="shrink-0">
                  <Search className="mr-2 h-4 w-4" /> {t('datatable.search')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-auto md:flex-nowrap">
        {showColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="md:ml-auto shrink-0">
                {columnsButtonLabel ?? t('datatable.columns')} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('datatable.columns_visibility')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setAllVisibility(true)}>
                {t('datatable.show_all')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAllVisibility(false)}>
                {t('datatable.hide_all')}
              </DropdownMenuItem>
              {storageKey && (
                <DropdownMenuItem
                  onClick={() => {
                    try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
                    setAllVisibility(true)
                  }}
                >
                  {t('datatable.reset_default')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {toggleable.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={c.getIsVisible()}
                  onCheckedChange={(v) => c.toggleVisibility(!!v)}
                  className="capitalize"
                >
                  {resolveColumnLabel<TData>(c)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Auto refresh selector (dropdown like columns) */}
        {typeof onAutoRefreshChange === 'function' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="md:ml-auto shrink-0">
                {t('datatable.auto_refresh')}: {(autoRefreshValue ?? 'off') === 'off' ? t('datatable.off') : (autoRefreshValue ?? '')}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{t('datatable.auto_refresh')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {['off','5s','10s','15s','30s','1m','5m','10m'].map((v) => {
                const label = (() => {
                  if (v === 'off') return t('datatable.off')
                  if (v.endsWith('s')) return t('datatable.seconds', { count: Number(v.replace('s','')) })
                  if (v.endsWith('m')) return t('datatable.minutes', { count: Number(v.replace('m','')) })
                  return v
                })()
                return (
                  <DropdownMenuItem key={v} onClick={() => onAutoRefreshChange(v)}>
                    {label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {rightSlot}
      </div>
    </div>
  )
}
