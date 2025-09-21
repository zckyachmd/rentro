import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { SearchOption } from '@/components/ui/search-select';
import { Separator } from '@/components/ui/separator';
import type {
    ContractCreateForm,
    ContractCreateLocal,
} from '@/types/management';

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    data: ContractCreateForm & ContractCreateLocal;
    tenantOptions: SearchOption[];
    roomOptions: SearchOption[];
    periodLabel: string;
    formatRupiah: (val: string) => string;
    processing: boolean;
    onConfirm: () => void;
};

export default function ContractCreatePreviewDialog({
    open,
    onOpenChange,
    data,
    tenantOptions,
    roomOptions,
    periodLabel,
    formatRupiah,
    processing,
    onConfirm,
}: Props) {
    const [confirmChecked, setConfirmChecked] = React.useState(false);

    React.useEffect(() => {
        if (open) setConfirmChecked(false);
    }, [open]);

    const tenant = tenantOptions.find((t) => t.value === data.user_id);
    const room = roomOptions.find((r) => r.value === data.room_id);
    const tenantInitial = (tenant?.label || '?').slice(0, 1).toUpperCase();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>Konfirmasi Data Kontrak</DialogTitle>
                    <DialogDescription>
                        Tinjau kembali data. Pastikan semua informasi sudah
                        benar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="flex items-center gap-3 rounded-md border p-3">
                        <Avatar className="size-10">
                            <AvatarFallback className="text-sm font-medium">
                                {tenantInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                                {tenant?.label ?? 'Penyewa belum dipilih'}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                                {tenant?.description || '-'}
                            </div>
                        </div>
                        <div className="ml-auto">
                            <Badge variant="secondary">Pengguna</Badge>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="text-sm font-medium">
                            Rincian Kontrak
                        </div>
                        <div className="grid grid-cols-1 items-stretch gap-3 text-sm sm:grid-cols-2">
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Kamar
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={room?.label ?? '-'}
                                >
                                    {room?.label ?? '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Lokasi
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={room?.description || '-'}
                                >
                                    {room?.description || '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Periode
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={periodLabel}
                                >
                                    {periodLabel}
                                </span>
                            </div>
                            {(data.billing_period === 'Monthly' ||
                                data.billing_period === 'Weekly' ||
                                data.billing_period === 'Daily') && (
                                <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                    <span className="text-muted-foreground">
                                        Pembayaran
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={
                                            data.billing_period === 'Monthly'
                                                ? data.monthly_payment_mode ===
                                                  'full'
                                                    ? 'Lunas'
                                                    : 'Per bulan'
                                                : 'Lunas'
                                        }
                                    >
                                        {data.billing_period === 'Monthly'
                                            ? data.monthly_payment_mode ===
                                              'full'
                                                ? 'Lunas'
                                                : 'Per bulan'
                                            : 'Lunas'}
                                    </span>
                                </div>
                            )}
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Auto-renew
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={
                                        data.auto_renew ? 'Aktif' : 'Nonaktif'
                                    }
                                >
                                    {data.auto_renew ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Tanggal Penagihan
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={data.billing_day || '-'}
                                >
                                    {data.billing_day || '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Tanggal Mulai
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={data.start_date || '-'}
                                >
                                    {data.start_date || '-'}
                                </span>
                            </div>
                            <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                <span className="text-muted-foreground">
                                    Tanggal Berakhir
                                </span>
                                <span
                                    className="min-w-0 justify-self-end truncate text-right font-medium"
                                    title={data.end_date || '-'}
                                >
                                    {data.end_date || '-'}
                                </span>
                            </div>
                            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                                <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                    <span className="text-muted-foreground">
                                        Deposit
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={formatRupiah(
                                            data.deposit_rupiah,
                                        )}
                                    >
                                        {formatRupiah(data.deposit_rupiah)}
                                    </span>
                                </div>
                                <div className="grid h-full grid-cols-[auto,1fr] items-center gap-3 rounded-md bg-muted/30 p-3">
                                    <span className="text-muted-foreground">
                                        Biaya Sewa
                                    </span>
                                    <span
                                        className="min-w-0 justify-self-end truncate text-right font-medium"
                                        title={formatRupiah(data.rent_rupiah)}
                                    >
                                        {formatRupiah(data.rent_rupiah)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {data.notes ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Catatan</div>
                            <div className="rounded-md border bg-muted/20 p-3 text-sm">
                                {data.notes}
                            </div>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="confirm"
                            checked={confirmChecked}
                            onCheckedChange={(v) =>
                                setConfirmChecked(Boolean(v))
                            }
                        />
                        <Label htmlFor="confirm" className="text-sm">
                            Saya telah memeriksa dan memastikan data di atas
                            sudah benar.
                        </Label>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={!confirmChecked || processing}
                        >
                            Simpan
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
