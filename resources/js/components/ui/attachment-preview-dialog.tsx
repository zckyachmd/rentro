import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type AttachmentPreviewDialogProps = {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  details?: { label: string; value: string }[];
};

export default function AttachmentPreviewDialog({ url, open, onOpenChange, title = 'Pratinjau Lampiran', description = 'Pratinjau file terlampir.', details = [] }: AttachmentPreviewDialogProps) {
  const [mime, setMime] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [length, setLength] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function detect() {
      if (!open || !url) return;
      setLoading(true);
      setMime(null);
      try {
        const res = await fetch(url, { method: 'HEAD', credentials: 'same-origin' });
        if (!cancelled) {
          setMime(res.headers.get('Content-Type'));
          const len = res.headers.get('Content-Length');
          setLength(len ? Number(len) : null);
        }
      } catch {
        // ignore errors, fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    detect();
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  const isImage = mime ? mime.startsWith('image/') : false;
  const fmtSize = (n?: number | null) => {
    if (!n || n <= 0) return '—';
    const units = ['B','KB','MB','GB'];
    let u = 0; let s = n;
    while (s >= 1024 && u < units.length - 1) { s /= 1024; u++; }
    return `${s.toFixed(1)} ${units[u]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {details.length ? (
            <div className="rounded-md border p-2 text-xs">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {details.map((d, i) => (
                  <React.Fragment key={i}>
                    <div className="text-muted-foreground">{d.label}</div>
                    <div className="text-right font-medium">{d.value || '—'}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : null}
        <div className="rounded-md border bg-background p-1">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Memuat pratinjau…</div>
          ) : isImage ? (
            <div className="flex max-h-[65vh] items-center justify-center overflow-auto">
              <img src={url} alt="Lampiran" className="max-h-[65vh] w-auto" />
            </div>
          ) : (
            <iframe title="attachment-preview" src={url} className="h-[65vh] w-full rounded" />
          )}
          <div className="px-1 pb-1 pt-2 text-[10px] text-muted-foreground">Tipe file: {mime || 'tidak diketahui'} • Ukuran: {fmtSize(length)}</div>
        </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
