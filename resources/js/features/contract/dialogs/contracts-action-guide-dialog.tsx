import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function ContractsActionGuideDialog({
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
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
