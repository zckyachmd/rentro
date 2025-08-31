import { Crown, GripVertical, Trash2 } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export type ImageDropzoneProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
  multiple?: boolean
  accept?: string
  className?: string
  dedupe?: boolean
  reorderable?: boolean
  enableCover?: boolean
}

export function ImageDropzone({
  files,
  onFilesChange,
  disabled = false,
  multiple = true,
  accept = 'image/*',
  className,
  dedupe = true,
  reorderable = true,
  enableCover = false,
}: ImageDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [previews, setPreviews] = React.useState<string[]>([])
  const [dragIndex, setDragIndex] = React.useState<number | null>(null)
  const [overIndex, setOverIndex] = React.useState<number | null>(null)


  const append = React.useCallback(
    (list: FileList | File[]) => {
      const arr = Array.from(list)
      let next = arr.filter((f) => f.type.startsWith('image/'))
      if (!next.length) return
      if (dedupe) {
        const fp = (f: File) => `${f.name}#${f.size}#${f.lastModified}`
        const existing = new Set((files || []).map(fp))
        const unique: File[] = []
        for (const f of next) {
          const id = fp(f)
          if (!existing.has(id)) {
            existing.add(id)
            unique.push(f)
          }
        }
        next = unique
      }
      if (!next.length) return
      onFilesChange([...(files || []), ...next])
    },
    [files, onFilesChange, dedupe],
  )

  const onDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled) return
      setIsDragging(false)
      if (e.dataTransfer?.files) append(e.dataTransfer.files)
    },
    [append, disabled],
  )

  const onChoose = React.useCallback(() => {
    if (disabled) return
    inputRef.current?.click()
  }, [disabled])

  React.useEffect(() => {
    const urls = (files || []).map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [files])

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          if (disabled) return
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onChoose()
          }
        }}
        className={`relative flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/30'
        } ${disabled ? 'opacity-50' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      >
        <p className="text-sm font-medium text-foreground">Seret & jatuhkan gambar ke sini</p>
        <p className="text-xs text-muted-foreground">atau klik tombol di bawah untuk memilih file</p>
        <Button type="button" variant="secondary" disabled={disabled} onClick={onChoose}>
          Pilih file
        </Button>
        <Input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={(e) => {
            if (e.currentTarget.files) append(e.currentTarget.files)
            e.currentTarget.value = ''
          }}
        />
        {isDragging && dragIndex === null && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-md bg-primary/10">
            <div className="rounded-md bg-background/80 px-3 py-1 text-sm font-medium text-primary shadow-sm">
              Lepas untuk mengunggah
            </div>
          </div>
        )}
        {files?.length ? (
          <div className="mt-4 w-full">
            <div className="mb-2 text-left text-xs text-muted-foreground">
              {files.length} file terpilih
            </div>
            <ScrollArea className="max-h-56 w-full pr-2">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {files.map((f, i) => {
                  const key = `${f.name}#${f.size}#${f.lastModified}`
                  return (
                    <div
                      key={key}
                      className={`group relative rounded-md border p-2 text-xs transition-shadow ${
                        overIndex === i && dragIndex !== null
                          ? 'border-primary border-2 border-dashed bg-primary/5'
                          : 'hover:shadow-sm'
                      }`}
                      draggable={reorderable && !disabled}
                      onDragStart={() => { if (!(reorderable && !disabled)) return; setDragIndex(i) }}
                      onDragEnter={() => { if (!(reorderable && !disabled)) return; setOverIndex(i) }}
                      onDragOver={(e) => { if (!(reorderable && !disabled)) return; e.preventDefault() }}
                      onDragEnd={() => { if (!(reorderable && !disabled)) return; setDragIndex(null); setOverIndex(null) }}
                      onDrop={(e) => {
                        if (!(reorderable && !disabled)) return;
                        e.preventDefault();
                        if (dragIndex === null || dragIndex === i) { setDragIndex(null); setOverIndex(null); return; }
                        const next = files.slice();
                        const [moved] = next.splice(dragIndex, 1);
                        next.splice(i, 0, moved);
                        setDragIndex(null); setOverIndex(null);
                        onFilesChange(next);
                      }}
                    >
                      {/* Drag handle (top-left) */}
                      <div className="pointer-events-none absolute left-1 top-1 z-10 hidden rounded bg-background/80 p-1 text-muted-foreground shadow-sm group-hover:block">
                        <GripVertical className={`h-4 w-4 ${reorderable && !disabled ? 'opacity-100' : 'opacity-40'}`} />
                      </div>

                      {/* Delete (top-right) */}
                      <button
                        type="button"
                        aria-label="Hapus gambar"
                        className="absolute right-1 top-1 z-10 hidden rounded bg-background/80 p-1 text-muted-foreground shadow-sm transition group-hover:block hover:text-foreground"
                        onClick={(e) => { e.preventDefault(); onFilesChange(files.filter((_, idx) => idx !== i)) }}
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {/* Cover badge (bottom-right) or Set Cover button */}
                      {enableCover && (i === 0 ? (
                        <div className="pointer-events-none absolute bottom-1 right-1 z-10 rounded bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow">Cover</div>
                      ) : (
                        <button
                          type="button"
                          aria-label="Jadikan cover"
                          className="absolute bottom-1 right-1 z-10 hidden rounded bg-background/80 p-1 text-muted-foreground shadow-sm transition group-hover:block hover:text-foreground"
                          disabled={disabled}
                          onClick={() => { const next = files.slice(); const [moved] = next.splice(i, 1); next.splice(0, 0, moved); onFilesChange(next) }}
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                      ))}

                      {/* Thumbnail */}
                      <div className="relative mb-1 overflow-hidden rounded-md">
                        {previews[i] ? (
                          <img
                            src={previews[i]}
                            alt={f.name}
                            className="h-32 w-full rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-32 w-full rounded-md bg-muted" />
                        )}
                      </div>

                      {/* Filename (single line) */}
                      <div className="min-w-0 px-0.5 text-[11px]">
                        <div className="truncate" title={f.name}>{f.name}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ImageDropzone
