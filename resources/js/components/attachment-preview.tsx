import React from 'react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ImageSpotlight,
    type SpotlightItem,
} from '@/components/ui/image-spotlight';
import { createAbort, head } from '@/lib/api';

export type AttachmentPreviewDialogProps = {
    url: string;
    urls?: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    details?: { label: string; value: string }[];
};

export default function AttachmentPreviewDialog({
    url,
    urls,
    open,
    onOpenChange,
    title = 'Pratinjau Lampiran',
    description = 'Pratinjau file terlampir.',
    details = [],
}: AttachmentPreviewDialogProps) {
    const sources = React.useMemo(() => {
        const list =
            Array.isArray(urls) && urls.length ? urls : url ? [url] : [];
        return list.filter(Boolean);
    }, [urls, url]);

    const [mimes, setMimes] = React.useState<Array<string | null>>([]);
    const [sizes, setSizes] = React.useState<Array<number | null>>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const ctrl = createAbort();
        (async () => {
            if (!open || sources.length === 0) return;
            setLoading(true);
            const nextMimes: Array<string | null> = Array(sources.length).fill(
                null,
            );
            const nextSizes: Array<number | null> = Array(sources.length).fill(
                null,
            );
            try {
                for (let i = 0; i < sources.length; i++) {
                    try {
                        const res = await head(sources[i], {
                            signal: ctrl.signal,
                        });
                        nextMimes[i] = res.headers.get('Content-Type');
                        const len = res.headers.get('Content-Length');
                        nextSizes[i] = len ? Number(len) : null;
                    } catch {
                        nextMimes[i] = null;
                        nextSizes[i] = null;
                    }
                }
                if (!ctrl.signal.aborted) {
                    setMimes(nextMimes);
                    setSizes(nextSizes);
                }
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        })();
        return () => ctrl.abort();
    }, [open, sources]);

    const isImage = React.useCallback((idx: number): boolean => {
        const m = mimes[idx];
        if (m && m.startsWith('image/')) return true;
        const u = sources[idx] || '';
        return /(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.bmp)$/i.test(u);
    }, [mimes, sources]);
    const fmtSize = (n?: number | null) => {
        if (!n || n <= 0) return '—';
        const units = ['B', 'KB', 'MB', 'GB'];
        let u = 0;
        let s = n;
        while (s >= 1024 && u < units.length - 1) {
            s /= 1024;
            u++;
        }
        return `${s.toFixed(1)} ${units[u]}`;
    };

    const imageItems = React.useMemo<SpotlightItem[]>(() => {
        return sources.map((u) => ({ url: u })).filter((_, i) => isImage(i));
    }, [sources, isImage]);
    const imageIndexMap = React.useMemo(() => {
        const map = new Map<number, number>();
        let imgIdx = 0;
        sources.forEach((_, i) => {
            if (isImage(i)) {
                map.set(i, imgIdx);
                imgIdx++;
            }
        });
        return map;
    }, [sources, isImage]);
    const [spotlightOpen, setSpotlightOpen] = React.useState(false);
    const [spotlightIndex, setSpotlightIndex] = React.useState(0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-xs">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {details.length ? (
                        <div className="rounded-md border p-2 text-xs">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                {details.map((d, i) => (
                                    <React.Fragment key={i}>
                                        <div className="text-muted-foreground">
                                            {d.label}
                                        </div>
                                        <div className="text-right font-medium">
                                            {d.value || '—'}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {sources.length <= 1 ? (
                        <div className="rounded-md border bg-background p-1">
                            {loading ? (
                                <div className="p-4 text-sm text-muted-foreground">
                                    Memuat pratinjau…
                                </div>
                            ) : sources[0] && isImage(0) ? (
                                <div className="flex max-h-[65vh] items-center justify-center overflow-auto">
                                    <img
                                        src={sources[0]}
                                        alt="Lampiran"
                                        className="max-h-[65vh] w-auto cursor-zoom-in"
                                        onClick={() => {
                                            const idx =
                                                imageIndexMap.get(0) ?? 0;
                                            setSpotlightIndex(idx);
                                            setSpotlightOpen(true);
                                        }}
                                    />
                                </div>
                            ) : sources[0] ? (
                                <iframe
                                    title="attachment-preview"
                                    src={sources[0]}
                                    className="h-[65vh] w-full rounded"
                                />
                            ) : null}
                            <div className="px-1 pb-1 pt-2 text-[10px] text-muted-foreground">
                                Tipe file: {mimes[0] || 'tidak diketahui'} •
                                Ukuran: {fmtSize(sizes[0])}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {sources.map((src, i) => (
                                    <div
                                        key={i}
                                        className="group overflow-hidden rounded-md border bg-background"
                                    >
                                        {isImage(i) ? (
                                            <AspectRatio
                                                ratio={4 / 3}
                                                className="cursor-zoom-in bg-muted"
                                            >
                                                <img
                                                    src={src}
                                                    alt={`Lampiran ${i + 1}`}
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                                                    onClick={() => {
                                                        const idx =
                                                            imageIndexMap.get(
                                                                i,
                                                            ) ?? 0;
                                                        setSpotlightIndex(idx);
                                                        setSpotlightOpen(true);
                                                    }}
                                                />
                                            </AspectRatio>
                                        ) : (
                                            <div className="p-2">
                                                <div className="rounded bg-muted p-2 text-center text-xs text-muted-foreground">
                                                    Pratinjau tidak tersedia
                                                </div>
                                                <div className="mt-2 truncate text-[11px] text-muted-foreground">
                                                    {mimes[i] || 'unknown'} •{' '}
                                                    {fmtSize(sizes[i])}
                                                </div>
                                                <div className="mt-2 text-right">
                                                    <a
                                                        href={src}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-primary underline"
                                                    >
                                                        Buka
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
            <ImageSpotlight
                open={spotlightOpen}
                onOpenChange={setSpotlightOpen}
                items={imageItems}
                index={spotlightIndex}
                onIndexChange={setSpotlightIndex}
            />
        </Dialog>
    );
}
