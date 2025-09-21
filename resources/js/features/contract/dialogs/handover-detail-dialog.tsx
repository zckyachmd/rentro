'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/format';
import type {
    ManagementHandover,
    HandoverMode as Mode,
} from '@/types/management';

export default function HandoverDetail({
    open,
    onOpenChange,
    handover,
    onRedo,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    handover: ManagementHandover | null;
    onRedo?: (mode: Mode) => void;
}) {
    const currentHandover = handover;
    const dismiss = React.useCallback(
        () => onOpenChange(false),
        [onOpenChange],
    );

    const [lightbox, setLightbox] = React.useState<{
        open: boolean;
        index: number;
        items: SpotlightItem[];
    }>({ open: false, index: 0, items: [] });
    const [showAllAttachments, setShowAllAttachments] = React.useState(false);
    const [redoInProgress, setRedoInProgress] = React.useState(false);

    // Determine redo marker purely from backend-provided meta
    const redoMarked = React.useMemo(() => {
        if (!currentHandover) return false;
        const anyH = currentHandover as unknown as {
            meta?: { redone?: boolean; redo?: Record<string, boolean> };
            redone?: boolean;
        };
        const redone = Boolean(anyH?.meta?.redone ?? anyH?.redone);
        const redoByType = Boolean(
            anyH?.meta?.redo?.[currentHandover.type] === true,
        );
        return redone || redoByType;
    }, [currentHandover]);

    // Reset view state when switching handover
    React.useEffect(() => {
        setShowAllAttachments(false);
        setRedoInProgress(false);
    }, [currentHandover?.id]);

    const ackSameAsRecorded = React.useMemo(() => {
        if (!currentHandover?.acknowledged_at || !currentHandover?.recorded_at)
            return false;
        return (
            formatDate(currentHandover.acknowledged_at, true) ===
            formatDate(currentHandover.recorded_at, true)
        );
    }, [currentHandover]);
    const disputeSameAsRecorded = React.useMemo(() => {
        if (!currentHandover?.disputed_at || !currentHandover?.recorded_at)
            return false;
        return (
            formatDate(currentHandover.disputed_at, true) ===
            formatDate(currentHandover.recorded_at, true)
        );
    }, [currentHandover]);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                    <DialogHeader className="px-5 pb-4 pt-6 sm:px-6">
                        <DialogTitle>Detail Serah Terima</DialogTitle>
                        <DialogDescription>
                            {currentHandover
                                ? `Ringkasan ${currentHandover.type} — ${formatDate(currentHandover.recorded_at, true)}`
                                : 'Ringkasan entri serah terima.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Separator />

                    {currentHandover ? (
                        <div className="flex-1 overflow-auto overscroll-contain">
                            <div className="space-y-6 px-5 py-6 sm:px-6">
                                {/* Status Tanggapan Tenant */}
                                <section className="rounded-xl border bg-muted/10">
                                    <div className="flex flex-col gap-4 p-5">
                                        <div className="space-y-1">
                                            <div className="text-sm font-semibold text-foreground">
                                                Status Tanggapan Tenant
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Aksi terakhir yang dicatat oleh
                                                tenant.
                                            </p>
                                        </div>

                                        {currentHandover.disputed ? (
                                            <div className="mx-0 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:p-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Badge variant="destructive">
                                                        Disanggah
                                                    </Badge>
                                                    {!disputeSameAsRecorded && (
                                                        <span className="text-destructive">
                                                            {formatDate(
                                                                currentHandover.disputed_at,
                                                                true,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                {currentHandover.dispute_note ? (
                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-destructive">
                                                        {
                                                            currentHandover.dispute_note
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : currentHandover.acknowledged ? (
                                            <div className="mx-0 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-900/15 sm:p-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Badge variant="outline">
                                                        Dikonfirmasi
                                                    </Badge>
                                                    {!ackSameAsRecorded && (
                                                        <span className="text-muted-foreground">
                                                            {formatDate(
                                                                currentHandover.acknowledged_at,
                                                                true,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                {currentHandover.acknowledge_note ? (
                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                                                        {
                                                            currentHandover.acknowledge_note
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed bg-background/60 px-4 py-6 text-sm text-muted-foreground">
                                                Belum ada konfirmasi dari
                                                tenant.
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Meta ringkas */}
                                <section className="rounded-xl border bg-muted/10">
                                    <div className="flex flex-col gap-4 p-5 text-sm">
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Jenis
                                                </div>
                                                <div className="text-base font-semibold capitalize">
                                                    {currentHandover.type}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Waktu
                                                </div>
                                                <div className="text-base font-semibold">
                                                    {formatDate(
                                                        currentHandover.recorded_at,
                                                        true,
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Status
                                                </div>
                                                <div>
                                                    <Badge variant="outline">
                                                        {currentHandover.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Catatan (tampilkan hanya jika ada) */}
                                {currentHandover.notes ? (
                                    <section className="rounded-xl border bg-muted/10">
                                        <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
                                            <div className="text-sm font-semibold text-foreground">
                                                Catatan
                                            </div>
                                            <ScrollArea className="max-h-48 min-h-[84px] overflow-auto rounded-lg border bg-background/80">
                                                <div className="max-w-full whitespace-pre-wrap break-words p-4 text-sm leading-relaxed [overflow-wrap:anywhere]">
                                                    {String(
                                                        currentHandover.notes,
                                                    )}
                                                </div>
                                                <ScrollBar orientation="vertical" />
                                            </ScrollArea>
                                        </div>
                                    </section>
                                ) : null}

                                {/* Lampiran (samakan perilaku dengan tenant: batasi 8, tombol lihat semua) */}
                                {currentHandover.attachments.length ? (
                                    <section className="rounded-xl border bg-muted/10">
                                        <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-semibold text-foreground">
                                                    Lampiran
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {
                                                        currentHandover
                                                            .attachments.length
                                                    }{' '}
                                                    file
                                                </span>
                                            </div>
                                            <ScrollArea className="max-h-[280px] rounded-lg border border-dashed bg-background/40">
                                                <div className="grid gap-3 p-3 sm:grid-cols-3 sm:p-4 md:grid-cols-4 md:p-5">
                                                    {(showAllAttachments
                                                        ? currentHandover.attachments
                                                        : currentHandover.attachments.slice(
                                                              0,
                                                              8,
                                                          )
                                                    ).map(
                                                        (
                                                            ff: string,
                                                            idx: number,
                                                        ) => {
                                                            const url = route(
                                                                'management.handovers.attachment.general',
                                                                {
                                                                    handover:
                                                                        currentHandover.id,
                                                                    path: ff,
                                                                },
                                                            );
                                                            const fileName =
                                                                ff
                                                                    .split('/')
                                                                    .pop() ??
                                                                ff;
                                                            return (
                                                                <button
                                                                    key={ff}
                                                                    type="button"
                                                                    className="group relative overflow-hidden rounded-lg border bg-background transition hover:border-primary"
                                                                    onClick={() =>
                                                                        setLightbox(
                                                                            {
                                                                                open: true,
                                                                                index: idx,
                                                                                items: (showAllAttachments
                                                                                    ? currentHandover.attachments
                                                                                    : currentHandover.attachments.slice(
                                                                                          0,
                                                                                          8,
                                                                                      )
                                                                                ).map(
                                                                                    (
                                                                                        fff: string,
                                                                                    ) => ({
                                                                                        url: route(
                                                                                            'management.handovers.attachment.general',
                                                                                            {
                                                                                                handover:
                                                                                                    currentHandover.id,
                                                                                                path: fff,
                                                                                            },
                                                                                        ),
                                                                                        alt:
                                                                                            fff
                                                                                                .split(
                                                                                                    '/',
                                                                                                )
                                                                                                .pop() ??
                                                                                            fff,
                                                                                    }),
                                                                                ),
                                                                            },
                                                                        )
                                                                    }
                                                                    title={
                                                                        fileName
                                                                    }
                                                                >
                                                                    <img
                                                                        src={
                                                                            url
                                                                        }
                                                                        alt={
                                                                            fileName
                                                                        }
                                                                        className="aspect-[4/3] w-full object-cover transition duration-150 group-hover:scale-[1.01]"
                                                                    />
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                                {currentHandover.attachments
                                                    .length > 8 &&
                                                !showAllAttachments ? (
                                                    <div className="border-t bg-background/60 p-2 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-xs"
                                                            onClick={() =>
                                                                setShowAllAttachments(
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            Lihat semua lampiran
                                                            (
                                                            {currentHandover
                                                                .attachments
                                                                .length -
                                                                8}{' '}
                                                            lagi)
                                                        </Button>
                                                    </div>
                                                ) : null}
                                                <ScrollBar orientation="vertical" />
                                            </ScrollArea>
                                        </div>
                                    </section>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                            Data serah terima tidak ditemukan.
                        </div>
                    )}

                    <DialogFooter className="border-t bg-background/95 px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={dismiss}
                        >
                            Tutup
                        </Button>
                        {currentHandover?.disputed && !redoMarked ? (
                            <Button
                                type="button"
                                className="w-full sm:w-auto"
                                disabled={redoInProgress}
                                onClick={() => {
                                    const mode: Mode =
                                        currentHandover.type === 'checkin'
                                            ? 'checkin'
                                            : 'checkout';
                                    setRedoInProgress(true);
                                    onRedo?.(mode);
                                }}
                            >
                                {currentHandover.type === 'checkin'
                                    ? 'Ulangi Check‑in'
                                    : 'Ulangi Check‑out'}
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ImageSpotlight
                open={lightbox.open}
                onOpenChange={(o) => setLightbox((s) => ({ ...s, open: o }))}
                items={lightbox.items}
                index={lightbox.index}
                onIndexChange={(i) => setLightbox((s) => ({ ...s, index: i }))}
            />
        </>
    );
}
