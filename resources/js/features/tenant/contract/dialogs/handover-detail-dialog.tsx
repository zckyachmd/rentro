'use client';

import { router } from '@inertiajs/react';
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
import type { TenantHandover } from '@/types/tenant';

export default function TenantHandoverDetailDialog({
    open,
    onOpenChange,
    handover,
    onRefetch,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    handover: TenantHandover | null;
    onRefetch?: () => void | Promise<void>;
}) {
    const currentHandover = handover;
    const [lightbox, setLightbox] = React.useState<{
        open: boolean;
        index: number;
        items: SpotlightItem[];
    }>({ open: false, index: 0, items: [] });
    const [ackSaving, setAckSaving] = React.useState(false);
    const [disputeSaving, setDisputeSaving] = React.useState(false);
    const [disputeMode, setDisputeMode] = React.useState(false);
    const [disputeNote, setDisputeNote] = React.useState('');
    const [showAllAttachments, setShowAllAttachments] = React.useState(false);

    const dismiss = React.useCallback(
        () => onOpenChange(false),
        [onOpenChange],
    );

    const canRespond = React.useMemo(() => {
        if (!currentHandover) return false;
        if (typeof currentHandover.meta?.can_respond === 'boolean') {
            return currentHandover.meta.can_respond;
        }
        const status = String(currentHandover.status || '').toLowerCase();
        return (
            status === 'pending' &&
            !currentHandover.acknowledged &&
            !currentHandover.disputed
        );
    }, [currentHandover]);

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

    const doReload = React.useCallback(async () => {
        try {
            router.reload({ only: ['contract'] });
            await Promise.resolve(onRefetch?.());
        } catch {
            // ignore
        }
    }, [onRefetch]);

    const doAcknowledge = React.useCallback(async () => {
        if (!currentHandover || ackSaving) return;
        setAckSaving(true);
        try {
            await new Promise<void>((resolve, reject) => {
                router.post(
                    route('tenant.handovers.ack', {
                        handover: currentHandover.id,
                    }),
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: async () => {
                            onOpenChange(false);
                            await doReload();
                            resolve();
                        },
                        onError: () => reject(new Error('Failed')),
                        onFinish: () => setAckSaving(false),
                    },
                );
            });
        } catch {
            setAckSaving(false);
        }
    }, [currentHandover, ackSaving, doReload, onOpenChange]);

    const doDispute = React.useCallback(async () => {
        if (!currentHandover || disputeSaving) return;
        if (disputeNote.trim().length < 5) {
            setDisputeMode(true);
            return;
        }
        setDisputeSaving(true);
        try {
            await new Promise<void>((resolve, reject) => {
                router.post(
                    route('tenant.handovers.dispute', {
                        handover: currentHandover.id,
                    }),
                    { note: disputeNote },
                    {
                        preserveScroll: true,
                        onSuccess: async () => {
                            onOpenChange(false);
                            await doReload();
                            resolve();
                        },
                        onError: () => reject(new Error('Failed')),
                        onFinish: () => setDisputeSaving(false),
                    },
                );
            });
        } catch {
            setDisputeSaving(false);
        }
    }, [currentHandover, disputeSaving, disputeNote, doReload, onOpenChange]);

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
                            <div className="space-y-5 px-5 py-5 sm:px-6">
                                {/* Meta + Status */}
                                <section className="rounded-xl border bg-muted/10">
                                    <div className="grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-3 sm:gap-4 sm:p-5">
                                        <div className="space-y-1">
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                                                Jenis
                                            </div>
                                            <div className="text-base font-semibold capitalize">
                                                {currentHandover.type}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
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
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                                                Status
                                            </div>
                                            <div>
                                                <Badge variant="outline">
                                                    {currentHandover.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ringkas status tanggapan */}
                                    {currentHandover.disputed ? (
                                        <div className="mx-4 mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:mx-5 sm:mb-5 sm:p-4">
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
                                        <div className="mx-4 mb-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-900/15 sm:mx-5 sm:mb-5 sm:p-4">
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
                                    ) : null}
                                </section>

                                {/* Catatan (tampil hanya jika ada) */}
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

                                {/* Lampiran (sembunyikan jika kosong) */}
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
                                                                'tenant.handovers.attachment.general',
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
                                                                                            'tenant.handovers.attachment.general',
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
                        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full sm:w-auto"
                                onClick={dismiss}
                            >
                                Tutup
                            </Button>

                            {currentHandover && canRespond ? (
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                    {disputeMode ? (
                                        <div className="flex w-full flex-col gap-2 sm:w-[360px]">
                                            <div className="text-xs font-medium text-muted-foreground">
                                                Alasan Sanggahan (min. 5
                                                karakter)
                                            </div>
                                            <textarea
                                                rows={3}
                                                className="w-full resize-y rounded-md border bg-background p-2 text-sm"
                                                value={disputeNote}
                                                onChange={(e) =>
                                                    setDisputeNote(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: terdapat kerusakan yang belum dicatat"
                                            />
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                <span>
                                                    {disputeNote.trim().length}
                                                    /5
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDisputeMode(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        Batal
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        disabled={
                                                            disputeSaving ||
                                                            disputeNote.trim()
                                                                .length < 5
                                                        }
                                                        onClick={doDispute}
                                                    >
                                                        {disputeSaving
                                                            ? 'Mengirim…'
                                                            : 'Kirim Sanggahan'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30"
                                                onClick={() =>
                                                    setDisputeMode(true)
                                                }
                                            >
                                                Sanggah
                                            </Button>
                                            <Button
                                                type="button"
                                                className="shadow-sm"
                                                disabled={ackSaving}
                                                onClick={doAcknowledge}
                                            >
                                                {ackSaving
                                                    ? 'Menyimpan…'
                                                    : 'Konfirmasi'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </div>
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
