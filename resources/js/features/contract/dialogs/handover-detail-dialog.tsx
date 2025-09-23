'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('management/contract');
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
                            <div className="space-y-6 px-5 py-6 sm:px-6">
                                {/* Tenant Response Status */}
                                <section className="bg-muted/10 rounded-xl border">
                                    <div className="flex flex-col gap-4 p-5">
                                        <div className="space-y-1">
                                            <div className="text-foreground text-sm font-semibold">{t('handover.tenant_response_title')}</div>
                                            <p className="text-muted-foreground text-xs">{t('handover.tenant_response_desc')}</p>
                                        </div>

                                        {currentHandover.disputed ? (
                                            <div className="border-destructive/30 bg-destructive/5 mx-0 rounded-lg border p-3 sm:p-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Badge variant="destructive">{t('handover.disputed')}</Badge>
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
                                            <div className="mx-0 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 sm:p-4 dark:border-emerald-900/40 dark:bg-emerald-900/15">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Badge variant="outline">{t('handover.confirmed')}</Badge>
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
                                        ) : (
                                            <div className="bg-background/60 text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-sm">{t('handover.no_tenant_confirmation')}</div>
                                        )}
                                    </div>
                                </section>

                                {/* Meta ringkas */}
                                <section className="bg-muted/10 rounded-xl border">
                                    <div className="flex flex-col gap-4 p-5 text-sm">
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t('common.type')}</div>
                                                <div className="text-base font-semibold capitalize">
                                                    {currentHandover.type}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t('common.time')}</div>
                                                <div className="text-base font-semibold">
                                                    {formatDate(
                                                        currentHandover.recorded_at,
                                                        true,
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t('common.status')}</div>
                                                <div>
                                                    <Badge variant="outline">
                                                        {currentHandover.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Notes (if any) */}
                                {currentHandover.notes ? (
                                    <section className="bg-muted/10 rounded-xl border">
                                        <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
                                            <div className="text-foreground text-sm font-semibold">{t('common.note')}</div>
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

                                {/* Attachments (limit 8, view all) */}
                                {currentHandover.attachments.length ? (
                                    <section className="bg-muted/10 rounded-xl border">
                                        <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="text-foreground text-sm font-semibold">{t('common.attachments')}</div>
                                                <span className="text-muted-foreground text-xs">{t('common.files', { count: currentHandover.attachments.length })}</span>
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
                                                            {t('common.view_all_attachments')} ({currentHandover.attachments.length - 8} {t('common.more')})
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
                        <div className="text-muted-foreground px-6 py-10 text-center text-sm">{t('handover.not_found')}</div>
                    )}

                    <DialogFooter className="bg-background/95 border-t px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={dismiss}
                        >
                            {t('common.close')}
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
                                    ? t('handover.menu.redo_checkin')
                                    : t('handover.menu.redo_checkout')}
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
