'use client';

import { router } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
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
    const { t } = useTranslation('management/contract');
    const { t: tTenant } = useTranslation('tenant/handover');
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
                    <DialogHeader className="px-5 pt-6 pb-4 sm:px-6">
                        <DialogTitle>{t('handover.detail_title')}</DialogTitle>
                        <DialogDescription>
                            {currentHandover
                                ? t('handover.summary', {
                                      type:
                                          currentHandover.type === 'checkin'
                                              ? t('handover.menu.checkin')
                                              : t('handover.menu.checkout'),
                                      date: formatDate(
                                          currentHandover.recorded_at,
                                          true,
                                      ),
                                  })
                                : t('handover.detail_desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <Separator />

                    {currentHandover ? (
                        <div className="flex-1 overflow-auto overscroll-contain">
                            <div className="space-y-5 px-5 py-5 sm:px-6">
                                {/* Meta + Status */}
                                <section className="bg-muted/10 rounded-xl border">
                                    <div className="grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-3 sm:gap-4 sm:p-5">
                                        <div className="space-y-1">
                                            <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase sm:text-xs">
                                                {t('common.type')}
                                            </div>
                                            <div className="text-base font-semibold capitalize">
                                                {currentHandover.type}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase sm:text-xs">
                                                {t('common.time')}
                                            </div>
                                            <div className="text-base font-semibold">
                                                {formatDate(
                                                    currentHandover.recorded_at,
                                                    true,
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase sm:text-xs">
                                                {t('common.status')}
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
                                        <div className="border-destructive/30 bg-destructive/5 mx-4 mb-4 rounded-lg border p-3 sm:mx-5 sm:mb-5 sm:p-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant="destructive">
                                                    {t('handover.disputed')}
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
                                                <p className="text-destructive mt-2 text-sm whitespace-pre-wrap">
                                                    {
                                                        currentHandover.dispute_note
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : currentHandover.acknowledged ? (
                                        <div className="mx-4 mb-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 sm:mx-5 sm:mb-5 sm:p-4 dark:border-emerald-900/40 dark:bg-emerald-900/15">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant="outline">
                                                    {t('handover.confirmed')}
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
                                                <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
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
                                    <section className="bg-muted/10 rounded-xl border">
                                        <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
                                            <div className="text-foreground text-sm font-semibold">
                                                {t('common.note')}
                                            </div>
                                            <ScrollArea className="bg-background/80 max-h-48 min-h-[84px] overflow-auto rounded-lg border">
                                                <div className="max-w-full p-4 text-sm leading-relaxed break-words wrap-anywhere whitespace-pre-wrap">
                                                    {String(
                                                        currentHandover.notes,
                                                    )}
                                                </div>
                                                <ScrollBar orientation="vertical" />
                                            </ScrollArea>
                                        </div>
                                    </section>
                                ) : null}

                                {/* Attachments (hide if empty) */}
                                {currentHandover.attachments.length ? (
                                    <section className="bg-muted/10 rounded-xl border">
                                        <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="text-foreground text-sm font-semibold">
                                                    {t('common.attachments')}
                                                </div>
                                                <span className="text-muted-foreground text-xs">
                                                    {t('common.files', {
                                                        count: currentHandover
                                                            .attachments.length,
                                                    })}
                                                </span>
                                            </div>
                                            <ScrollArea className="bg-background/40 max-h-[280px] rounded-lg border border-dashed">
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
                                                                    className="group bg-background hover:border-primary relative overflow-hidden rounded-lg border transition"
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
                                                                        className="aspect-4/3 w-full object-cover transition duration-150 group-hover:scale-[1.01]"
                                                                    />
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                                {currentHandover.attachments
                                                    .length > 8 &&
                                                !showAllAttachments ? (
                                                    <div className="bg-background/60 border-t p-2 text-center">
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
                        <div className="text-muted-foreground px-6 py-10 text-center text-sm">
                            Data serah terima tidak ditemukan.
                        </div>
                    )}

                    <DialogFooter className="bg-background/95 border-t px-6 py-4">
                        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full sm:w-auto"
                                onClick={dismiss}
                            >
                                {t('common.close')}
                            </Button>

                            {currentHandover && canRespond ? (
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                    {disputeMode ? (
                                        <div className="flex w-full flex-col gap-2 sm:w-[360px]">
                                            <div className="text-muted-foreground text-xs font-medium">
                                                {tTenant('dispute_label')}
                                            </div>
                                            <textarea
                                                rows={3}
                                                className="bg-background w-full resize-y rounded-md border p-2 text-sm"
                                                value={disputeNote}
                                                onChange={(e) =>
                                                    setDisputeNote(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={tTenant(
                                                    'dispute_placeholder',
                                                )}
                                            />
                                            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
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
                                                        {t('common.cancel')}
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
                                                            ? t(
                                                                  'common.sending',
                                                              )
                                                            : tTenant(
                                                                  'submit_dispute',
                                                              )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Can
                                                all={[
                                                    'tenant.handover.dispute',
                                                ]}
                                            >
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30"
                                                    onClick={() =>
                                                        setDisputeMode(true)
                                                    }
                                                >
                                                    {tTenant('dispute')}
                                                </Button>
                                            </Can>
                                            <Can all={['tenant.handover.ack']}>
                                                <Button
                                                    type="button"
                                                    className="shadow-sm"
                                                    disabled={ackSaving}
                                                    onClick={doAcknowledge}
                                                >
                                                    {ackSaving
                                                        ? t('common.saving')
                                                        : tTenant('confirm')}
                                                </Button>
                                            </Can>
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
