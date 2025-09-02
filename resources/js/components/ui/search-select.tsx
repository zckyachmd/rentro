"use client";

import { Check, ChevronsUpDown, Search } from 'lucide-react';
import * as React from 'react';

const { useMemo, useState, useCallback, memo, useDeferredValue } = React as unknown as {
  useMemo: typeof React.useMemo,
  useState: typeof React.useState,
  useCallback: typeof React.useCallback,
  memo: typeof React.memo,
  useDeferredValue: typeof React.useDeferredValue,
};

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type SearchOption = {
  value: string;
  label: string;
  description?: string;
  payload?: unknown;
};

type Props = {
  value?: string;
  onChange?: (value: string, option?: SearchOption | undefined) => void;
  options: SearchOption[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
};

type OptionsListProps = {
  items: SearchOption[];
  value?: string;
  onSelect: (opt: SearchOption) => void;
  emptyText: string;
};

const OptionsList = memo(function OptionsList({ items, value, onSelect, emptyText }: OptionsListProps) {
  if (items.length === 0) {
    return <div className="px-3 py-2 text-[13px] md:text-sm text-muted-foreground">{emptyText}</div>;
  }
  return (
    <div className="py-1">
      {items.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            'w-full text-left px-3 py-2.5 hover:bg-muted/60 flex items-start gap-2 min-w-0 text-[13px] md:text-sm'
          )}
          aria-selected={value === opt.value}
          onClick={() => onSelect(opt)}
        >
          <Check className={cn('h-4 w-4 mt-[2px] md:mt-0', value === opt.value ? 'opacity-100' : 'opacity-0')} />
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
            <span className="leading-tight break-words md:truncate">{opt.label}</span>
            {opt.description && (
              <span className="text-[12px] md:text-xs text-muted-foreground leading-tight break-words md:truncate md:max-w-[45%]">
                {opt.description}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

export default function SearchSelect({ value, onChange, options, placeholder = 'Pilih…', emptyText = 'Tidak ada hasil', className, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const deferredQuery = useDeferredValue(query)

  const selected = useMemo(() => options.find(o => o.value === value), [options, value])

  // Normalize once for cheaper filtering
  const normalized = useMemo(() =>
    options.map(o => ({
      ...o,
      _label: o.label.toLowerCase(),
      _desc: o.description?.toLowerCase() ?? '',
    })), [options]
  )

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return options
    return normalized.filter(o => (o._label.includes(q) || o._desc.includes(q)))
  }, [normalized, options, deferredQuery])

  const shouldScroll = useMemo(() => filtered.length > 8, [filtered.length])

  const handleSelect = useCallback((opt: SearchOption) => {
    onChange?.(opt.value, opt)
    setOpen(false)
  }, [onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-9 text-[13px] md:text-sm', className)}
          disabled={disabled}
        >
          <span className={cn('truncate text-[13px] md:text-sm', !selected && 'text-muted-foreground')}>{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 overflow-hidden" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari…" className="h-8 text-[13px] md:text-sm placeholder:text-[13px] md:placeholder:text-sm" />
          </div>
        </div>
        {shouldScroll ? (
          <ScrollArea className="h-[50vh] md:h-64">
            <OptionsList items={filtered} value={value} onSelect={handleSelect} emptyText={emptyText} />
          </ScrollArea>
        ) : (
          <OptionsList items={filtered} value={value} onSelect={handleSelect} emptyText={emptyText} />
        )}
      </PopoverContent>
    </Popover>
  )
}
