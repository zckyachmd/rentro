import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as React from 'react'

import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type SpotlightItem = {
  url: string
  alt?: string
  is_cover?: boolean
}

export function ImageSpotlight({
  open,
  onOpenChange,
  items,
  index,
  onIndexChange,
  className,
  showCounter = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SpotlightItem[]
  index: number
  onIndexChange?: (i: number) => void
  className?: string
  showCounter?: boolean
}) {
  const count = items.length
  const [current, setCurrent] = React.useState(index)
  const [zoom, setZoom] = React.useState(false)

  const setIdx = React.useCallback((i: number) => {
    const nextIdx = ((i % count) + count) % count;
    setCurrent(nextIdx);
    onIndexChange?.(nextIdx);
  }, [count, onIndexChange]);

  const next = React.useCallback(() => setIdx(current + 1), [setIdx, current]);
  const prev = React.useCallback(() => setIdx(current - 1), [setIdx, current]);

  React.useEffect(() => setCurrent(index), [index])
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, next, prev])

  const item = items[current]

  return (
    <Dialog open={open} onOpenChange={(o) => { setZoom(false); onOpenChange(o) }}>
      {/* We use a transparent content and keep overlay */}
      <DialogOverlay className="bg-black/80" />
      <DialogContent
        className={cn(
          'border-none bg-transparent p-0 shadow-none outline-none sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] max-w-[calc(100%-1rem)]',
          className,
        )}
      >
        <div className={cn('relative mx-auto w-full', zoom ? 'max-h-[90vh] overflow-auto' : 'max-h-[85vh]')}
             onClick={() => setZoom((z) => !z)}
             role="button" aria-label="Toggle zoom">
          <img
            src={item?.url}
            alt={item?.alt ?? 'image'}
            className={cn(
              'mx-auto select-none object-contain',
              zoom ? 'h-auto w-auto max-h-none max-w-none' : 'h-[85vh] w-auto',
            )}
          />
        </div>

        {/* Controls */}
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              onClick={(e) => { e.stopPropagation(); prev() }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              onClick={(e) => { e.stopPropagation(); next() }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}

        <button
          type="button"
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </button>

        {showCounter && count > 1 ? (
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 mx-auto w-fit rounded bg-black/50 px-2 py-0.5 text-xs text-white">
            {current + 1} / {count}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
