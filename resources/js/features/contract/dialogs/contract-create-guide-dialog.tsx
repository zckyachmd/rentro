import { CalendarClock, Info, RefreshCw, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export default function ContractCreateGuideDialog({
    prorata = false,
}: {
    prorata?: boolean;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    Panduan & Ketentuan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>Panduan & Ketentuan Kontrak</DialogTitle>
                    <DialogDescription>
                        Ringkasan aturan penting dan tips pengisian agar kontrak
                        rapi dan minim salah input.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-3 text-sm">
                    <div className="rounded-md border bg-muted/30 p-4">
                        <div className="mb-2 flex items-center gap-2 font-medium">
                            <Info className="size-4" /> Alur Singkat
                        </div>
                        <ol className="ml-5 list-decimal space-y-1">
                            <li>
                                Pilih <strong>penyewa</strong> dan{' '}
                                <strong>kamar</strong>.
                            </li>
                            <li>
                                Atur <strong>periode tagihan</strong>,{' '}
                                <strong>durasi</strong>, &{' '}
                                <strong>tanggal mulai</strong>.
                            </li>
                            <li>
                                Sistem otomatis mengisi{' '}
                                <em>tanggal berakhir</em> &{' '}
                                <em>tanggal penagihan</em> (terkunci).
                            </li>
                            <li>
                                Isi <strong>biaya sewa</strong> &{' '}
                                <strong>deposit</strong> (cek pratinjau rupiah).
                            </li>
                            <li>
                                Tentukan <strong>metode pembayaran</strong>:
                                <span className="block">
                                    • <strong>Bulanan</strong>: pilih{' '}
                                    <em>Per bulan</em> atau <em>Lunas</em>.
                                </span>
                                <span className="block">
                                    • <strong>Mingguan/Harian</strong>: otomatis{' '}
                                    <em>Lunas</em>.
                                </span>
                            </li>
                            <li>
                                Opsional: aktifkan <strong>Auto‑renew</strong>{' '}
                                untuk perpanjang otomatis.
                            </li>
                        </ol>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-md border p-4">
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                <ShieldCheck className="size-4" /> Deposit
                            </div>
                            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                <li>
                                    Uang jaminan, <em>bukan</em> pembayaran
                                    sewa.
                                </li>
                                <li>
                                    Dikembalikan saat kontrak berakhir sesuai
                                    kondisi & aturan.
                                </li>
                                <li>
                                    Dapat dipakai menutup kerusakan/tunggakan
                                    bila kebijakan mengizinkan.
                                </li>
                            </ul>
                        </div>

                        <div className="rounded-md border p-4">
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                <ShieldCheck className="size-4" /> Pembayaran
                            </div>
                            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                <li>
                                    Periode <strong>Bulanan</strong>: pilih{' '}
                                    <em>Per bulan</em> (ditagih tiap bulan) atau{' '}
                                    <em>Lunas</em> (bayar penuh di awal).
                                </li>
                                <li>
                                    Periode <strong>Mingguan</strong> &{' '}
                                    <strong>Harian</strong>: wajib{' '}
                                    <em>Lunas</em> (bayar penuh di awal).
                                </li>
                                <li>
                                    Pilihan pembayaran ini{' '}
                                    <strong>mempengaruhi invoice</strong>:
                                    <span className="block">
                                        • <em>Per bulan</em> ➜ invoice
                                        diterbitkan setiap bulan sesuai siklus.
                                    </span>
                                    <span className="block">
                                        • <em>Lunas</em> ➜ satu invoice di awal
                                        kontrak.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="rounded-md border p-4">
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                <RefreshCw className="size-4" /> Auto‑renew
                                Kontrak
                            </div>
                            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                <li>Perpanjang otomatis di akhir periode.</li>
                                <li>
                                    Default aktif untuk <strong>Bulanan</strong>
                                    ; non‑aktif untuk{' '}
                                    <strong>Mingguan/Harian</strong>.
                                </li>
                                <li>Bisa diubah kapan saja lewat checkbox.</li>
                            </ul>
                        </div>

                        <div className="rounded-md border p-4">
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                <CalendarClock className="size-4" /> Tanggal
                                Penagihan & Berakhir
                            </div>
                            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                                <li>
                                    Otomatis dari{' '}
                                    <em>tanggal mulai + periode</em>.
                                </li>
                                {prorata ? (
                                    <>
                                        <li>
                                            <strong>Prorata aktif</strong>:
                                            tanggal berakhir & tanggal penagihan
                                            dapat menyesuaikan secara
                                            proporsional pada periode pertama.
                                        </li>
                                        <li>
                                            Penagihan pertama mengikuti
                                            kebijakan prorata; periode
                                            berikutnya mengikuti siklus normal.
                                        </li>
                                    </>
                                ) : (
                                    <li>
                                        Tidak ada <em>prorata</em>; tanggal
                                        penagihan mengikuti tanggal mulai
                                        berikutnya (≈ 30 hari untuk bulanan).
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <Separator />

                    <div className="rounded-md border bg-muted/20 p-4">
                        <div className="mb-2 font-medium">Tips</div>
                        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                            <li>
                                Label kamar menampilkan nomor / nama, dan lokasi
                                di deskripsi.
                            </li>
                            <li>
                                Cek pratinjau rupiah untuk menghindari salah
                                ketik nominal besar.
                            </li>
                            <li>
                                Gunakan catatan kontrak untuk aturan khusus
                                (listrik/air, kondisi kamar, dsb.).
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            (document.activeElement as HTMLElement)?.blur?.()
                        }
                    >
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
