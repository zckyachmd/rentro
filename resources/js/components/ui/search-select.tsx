"use client";

import { Check, ChevronsUpDown, Search } from 'lucide-react';
import * as React from 'react';

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

export default function SearchSelect({ value, onChange, options, placeholder = 'Pilih…', emptyText = 'Tidak ada hasil', className, disabled }: Props) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const selected = React.useMemo(() => options.find(o => o.value === value), [options, value])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => (o.label.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false)))
  }, [options, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-9', className)}
          disabled={disabled}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 overflow-hidden" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari…" className="h-8" />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
            )}
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={cn('w-full text-left px-3 py-2 hover:bg-muted/60 flex items-center gap-2 min-w-0')}
                onClick={() => {
                  onChange?.(opt.value, opt)
                  setOpen(false)
                }}
              >
                <Check className={cn('h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                <span className="flex-1 min-w-0 truncate">{opt.label}</span>
                {opt.description && (
                  <span className="ml-2 text-xs text-muted-foreground truncate max-w-[45%]">{opt.description}</span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
