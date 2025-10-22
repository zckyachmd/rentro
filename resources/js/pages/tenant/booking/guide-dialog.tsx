import { Link } from '@inertiajs/react';
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

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function BookingGuideDialog({ open, onOpenChange }: Props) {
    const { helpUrl, hasHelp } = React.useMemo(() => {
        try {
            return { helpUrl: route('public.help'), hasHelp: true };
        } catch {
            return { helpUrl: '/help', hasHelp: false };
        }
    }, []);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Panduan Booking</DialogTitle>
                    <DialogDescription>
                        Langkah-langkah proses booking agar jelas dan tidak
                        ambigu.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>
                            Pilih kamar pada menu Browse Kamar. Perhatikan
                            informasi penting: gedung, tipe kamar, harga
                            per-bulan, dan deposit.
                        </li>
                        <li>
                            Tentukan Rencana Sewa: pilih tanggal mulai dan
                            durasi (bulan). Isi kode promo jika ada.
                        </li>
                        <li>
                            Klik Booking lalu cek ringkasan: kamar, tanggal
                            mulai, durasi, harga/bulan, deposit, dan estimasi
                            total. Tambahkan catatan jika perlu, lalu kirim.
                        </li>
                        <li>
                            Status awal booking adalah On Hold (menunggu
                            persetujuan). Pantau status pada menu Booking Saya.
                        </li>
                        <li>
                            Jika disetujui, tahap berikutnya adalah pembuatan
                            kontrak dan tagihan awal (sewa + deposit).
                            Pembayaran dapat dicek di menu Invoice.
                        </li>
                        <li>
                            Perubahan/pembatalan: hubungi pengelola melalui
                            kontak yang tersedia pada sistem jika diperlukan.
                        </li>
                    </ol>

                    <div className="text-muted-foreground text-xs">
                        Catatan: Estimasi total adalah perkiraan. Promo yang
                        valid akan diterapkan otomatis pada estimasi.
                    </div>

                    <div className="pt-1 text-sm">
                        Shortcut:
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={route('tenant.bookings.index')}>
                                    Booking Saya
                                </Link>
                            </Button>
                            {hasHelp && (
                                <Button asChild variant="ghost" size="sm">
                                    <a
                                        href={helpUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        FAQ/Pusat Bantuan
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
