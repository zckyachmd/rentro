import { router } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import React from 'react';

import { Can } from '@/components/acl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import HandoverCreate from '@/features/contract/dialogs/handover-create-dialog';
import HandoverDetail from '@/features/contract/dialogs/handover-detail-dialog';
import { createAbort, getJson } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type {
    ContractDTO,
    HandoverOptions,
    HandoverSummary,
    HandoverMode as Mode,
} from '@/types/management';

export default function HandoverRoomSection({
    contract,
    handover,
}: {
    contract: ContractDTO;
    handover?: HandoverOptions;
}) {
    const requireCheckinForActivate = Boolean(
        handover?.require_checkin_for_activate ?? true,
    );
    const minPhotosCheckin = Math.max(0, handover?.min_photos_checkin ?? 0);
    const minPhotosCheckout = Math.max(0, handover?.min_photos_checkout ?? 0);

    const [handoverList, setHandoverList] = React.useState<HandoverSummary[]>(
        [],
    );
    const [checkoutOpen, setCheckoutOpen] = React.useState(false);
    const [checkinOpen, setCheckinOpen] = React.useState(false);
    const [loadingHandover, setLoadingHandover] = React.useState(false);

    const [handoverDialog, setHandoverDialog] = React.useState<{
        open: boolean;
        data: HandoverSummary | null;
    }>({ open: false, data: null });

    const currentHandover = handoverDialog.data;

    const openHandover = (h: HandoverSummary) =>
        setHandoverDialog({ open: true, data: h });

    const normalizeHandovers = React.useCallback(
        (items?: HandoverSummary[]) =>
            (items ?? []).map((item) => ({
                ...item,
                attachments: Array.isArray(item.attachments)
                    ? item.attachments
                    : [],
            })),
        [],
    );

    const reloadHandovers = React.useCallback(async () => {
        const ctrl = createAbort();
        try {
            setLoadingHandover(true);
            const json = await getJson<{ handovers?: HandoverSummary[] }>(
                route('management.contracts.handovers.index', {
                    contract: contract.id,
                }),
                { signal: ctrl.signal },
            );
            setHandoverList(normalizeHandovers(json.handovers));
        } catch {
            // ignore
        } finally {
            if (!ctrl.signal.aborted) setLoadingHandover(false);
        }
    }, [contract.id, normalizeHandovers]);

    React.useEffect(() => {
        void reloadHandovers();
    }, [reloadHandovers]);

    return (
        <>
            <Card className="mt-6">
                <CardHeader className="pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Serah Terima</CardTitle>
                    </div>

                    {(() => {
                        const latestCheckin = handoverList.find(
                            (h) => h.type === 'checkin',
                        );
                        const latestCheckout = handoverList.find(
                            (h) => h.type === 'checkout',
                        );
                        const lastIn = String(
                            latestCheckin?.status || '',
                        ).toLowerCase();
                        const lastOut = String(
                            latestCheckout?.status || '',
                        ).toLowerCase();
                        const statusNow = String(
                            contract.status || '',
                        ).toLowerCase();

                        const hasConfirmedCheckin = handoverList.some(
                            (h) =>
                                h.type === 'checkin' &&
                                String(h.status || '').toLowerCase() ===
                                    'confirmed',
                        );
                        const hasPendingCheckin = lastIn === 'pending';

                        // Normal check‑in (first time, not pending)
                        const canNormalCheckin =
                            !hasPendingCheckin &&
                            !hasConfirmedCheckin &&
                            (statusNow === 'booked' ||
                                (!requireCheckinForActivate &&
                                    statusNow === 'active'));

                        // Redo check‑in if last one was disputed, even if require_checkin_for_activate is true
                        const canRedoCheckin =
                            !hasPendingCheckin &&
                            lastIn === 'disputed' &&
                            (statusNow === 'booked' || statusNow === 'active');

                        const canCheckin = canNormalCheckin || canRedoCheckin;

                        const canCheckout =
                            (statusNow === 'active' ||
                                (statusNow === 'completed' &&
                                    lastOut === 'disputed')) &&
                            (hasConfirmedCheckin || lastIn === 'confirmed') &&
                            lastOut !== 'pending' &&
                            lastOut !== 'confirmed';

                        if (!canCheckin && !canCheckout) return null;
                        return (
                            <Can any={['handover.create']}>
                                <div className="flex items-center gap-2">
                                    {canCheckin ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setCheckinOpen(true)}
                                        >
                                            {lastIn === 'disputed'
                                                ? 'Ulangi Check‑in'
                                                : 'Check‑in'}
                                        </Button>
                                    ) : null}
                                    {canCheckout ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() =>
                                                setCheckoutOpen(true)
                                            }
                                        >
                                            Check‑out
                                        </Button>
                                    ) : null}
                                </div>
                            </Can>
                        );
                    })()}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-background">
                                <TableRow className="align-middle">
                                    <TableHead className="min-w-[120px] px-4 py-3 text-left align-middle">
                                        Jenis
                                    </TableHead>
                                    <TableHead className="min-w-[180px] px-4 py-3 text-left align-middle">
                                        Waktu
                                    </TableHead>
                                    <TableHead className="min-w-[140px] px-4 py-3 text-left align-middle">
                                        Status
                                    </TableHead>
                                    <TableHead className="min-w-[140px] px-4 py-3 text-right align-middle">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingHandover ? (
                                    <>
                                        {[0, 1, 2].map((i) => (
                                            <TableRow key={`sk-${i}`}>
                                                <TableCell>
                                                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-7 w-24 animate-pulse rounded bg-muted" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </>
                                ) : handoverList.length ? (
                                    handoverList.map((h) => {
                                        return (
                                            <TableRow
                                                key={h.id}
                                                className="align-middle"
                                            >
                                                <TableCell className="px-4 py-3 align-middle capitalize">
                                                    {h.type}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 align-middle">
                                                    {formatDate(
                                                        h.recorded_at,
                                                        true,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 align-middle">
                                                    <Badge variant="outline">
                                                        {h.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right align-middle">
                                                    <div className="flex items-center justify-end">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    aria-label="Aksi Serah Terima"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-56"
                                                            >
                                                                <DropdownMenuLabel>
                                                                    Aksi
                                                                </DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        openHandover(
                                                                            h,
                                                                        )
                                                                    }
                                                                >
                                                                    Lihat detail
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow className="align-middle">
                                        <TableCell
                                            colSpan={4}
                                            className="px-4 py-8 text-center align-middle text-sm text-muted-foreground"
                                        >
                                            Belum ada riwayat serah terima.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <HandoverCreate
                open={checkoutOpen}
                onOpenChange={setCheckoutOpen}
                contractId={contract.id}
                mode="checkout"
                minPhotosCheckin={minPhotosCheckin}
                minPhotosCheckout={minPhotosCheckout}
                redo={(() => {
                    const latestOut = handoverList.find(
                        (h) => h.type === 'checkout',
                    );
                    const lastOut = String(latestOut?.status || '').toLowerCase();
                    return lastOut === 'disputed';
                })()}
                onSaved={async () => {
                    router.reload({ only: ['contract'] });
                    await reloadHandovers();
                }}
            />

            <HandoverCreate
                open={checkinOpen}
                onOpenChange={setCheckinOpen}
                contractId={contract.id}
                mode="checkin"
                minPhotosCheckin={minPhotosCheckin}
                minPhotosCheckout={minPhotosCheckout}
                redo={(() => {
                    const latestIn = handoverList.find(
                        (h) => h.type === 'checkin',
                    );
                    const lastIn = String(latestIn?.status || '').toLowerCase();
                    return lastIn === 'disputed';
                })()}
                onSaved={async () => {
                    router.reload({ only: ['contract'] });
                    await reloadHandovers();
                }}
            />

            <HandoverDetail
                open={handoverDialog.open}
                onOpenChange={(o: boolean) =>
                    setHandoverDialog((s) => ({ ...s, open: o }))
                }
                handover={currentHandover}
                onRedo={(mode: Mode) => {
                    setHandoverDialog((s) => ({ ...s, open: false }));
                    if (mode === 'checkin') setCheckinOpen(true);
                    else setCheckoutOpen(true);
                }}
            />
        </>
    );
}
