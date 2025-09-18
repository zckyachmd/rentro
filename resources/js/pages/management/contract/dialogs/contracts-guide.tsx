import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function ContractsGuideDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Panduan Aksi Kontrak</DialogTitle>
                    <DialogDescription>
                        Ringkasan tindakan yang tersedia bagi admin.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    <div>
                        <div className="font-medium">Check‑in</div>
                        <ul className="mt-1 list-inside list-disc text-muted-foreground">
                            <li>
                                Tersedia saat kontrak berstatus Active dan belum
                                pernah check‑in.
                            </li>
                            <li>Isi catatan minimal 100 karakter.</li>
                            <li>
                                Unggah minimal 1 foto bukti (maksimal 5 foto).
                            </li>
                            <li>Ikon pada menu Aksi: LogIn.</li>
                        </ul>
                    </div>
                    <div>
                        <div className="font-medium">Check‑out</div>
                        <ul className="mt-1 list-inside list-disc text-muted-foreground">
                            <li>
                                Tersedia saat kontrak Active dan sudah check‑in,
                                serta belum check‑out.
                            </li>
                            <li>Isi catatan minimal 100 karakter.</li>
                            <li>Foto opsional (maksimal 5 foto).</li>
                            <li>Ikon pada menu Aksi: LogOut.</li>
                        </ul>
                    </div>
                    <div>
                        <div className="font-medium">Pengaruh Pengaturan</div>
                        <ul className="mt-1 list-inside list-disc text-muted-foreground">
                            <li>
                                Jika{' '}
                                <code>
                                    handover.require_checkin_for_activate
                                </code>{' '}
                                = true, scheduler tidak mengaktifkan kontrak
                                Booked secara otomatis. Aktivasi menunggu proses
                                check‑in dan (opsional) konfirmasi tenant jika
                                disetel.
                            </li>
                            <li>
                                Jika pengaturan tersebut = false, scheduler akan
                                mengaktifkan kontrak saat tanggal mulai tiba;
                                check‑in dapat dilakukan secara retroaktif saat
                                Active.
                            </li>
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Mengerti
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
