import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('tenant/booking');
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('guide', 'Panduan Booking')}</DialogTitle>
                    <DialogDescription>
                        {t(
                            'guide_desc',
                            'Langkah-langkah proses booking agar jelas dan tidak ambigu.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    <ol className="list-decimal space-y-2 pl-5">
                        <li>
                            {t(
                                'guide_steps.1',
                                'Pilih kamar pada menu Browse Kamar. Perhatikan informasi penting: gedung, tipe kamar, harga per-bulan, dan deposit.',
                            )}
                        </li>
                        <li>
                            {t(
                                'guide_steps.2',
                                'Tentukan Rencana Sewa: pilih tanggal mulai dan durasi (bulan). Isi kode promo jika ada.',
                            )}
                        </li>
                        <li>
                            {t(
                                'guide_steps.3',
                                'Klik Booking lalu cek ringkasan: kamar, tanggal mulai, durasi, harga/bulan, deposit, dan estimasi total. Tambahkan catatan jika perlu, lalu kirim.',
                            )}
                        </li>
                        <li>
                            {t(
                                'guide_steps.4',
                                'Status awal booking adalah On Hold (menunggu persetujuan). Pantau status pada menu Booking Saya.',
                            )}
                        </li>
                        <li>
                            {t(
                                'guide_steps.5',
                                'Jika disetujui, tahap berikutnya adalah pembuatan kontrak dan tagihan awal (sewa + deposit). Pembayaran dapat dicek di menu Invoice.',
                            )}
                        </li>
                        <li>
                            {t(
                                'guide_steps.6',
                                'Perubahan/pembatalan: hubungi pengelola melalui kontak yang tersedia pada sistem jika diperlukan.',
                            )}
                        </li>
                    </ol>

                    <div className="text-muted-foreground text-xs">
                        {t(
                            'guide_note',
                            'Catatan: Estimasi total adalah perkiraan. Promo yang valid akan diterapkan otomatis pada estimasi.',
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        {t('common.close', 'Tutup')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
