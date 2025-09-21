import React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ContactDTO } from '@/types/profile';

export default function ContactDeleteDialog({
    target,
    onCancel,
    onConfirm,
}: {
    target: ContactDTO | null;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const [agree, setAgree] = React.useState(false);

    React.useEffect(() => {
        if (target) {
            setAgree(false);
        }
    }, [target]);

    return (
        <Dialog open={!!target} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Hapus Kontak Darurat</DialogTitle>
                    <DialogDescription>
                        {target ? (
                            <>
                                Anda akan menghapus kontak <b>{target.name}</b>{' '}
                                ({target.relationship}). Tindakan ini tidak
                                dapat dibatalkan.
                            </>
                        ) : (
                            'Anda akan menghapus kontak ini. Tindakan ini tidak dapat dibatalkan.'
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-start space-x-2 rounded-md border p-3">
                    <Checkbox
                        id="ack"
                        checked={agree}
                        onCheckedChange={(v) => setAgree(Boolean(v))}
                    />
                    <label
                        htmlFor="ack"
                        className="text-sm leading-snug text-muted-foreground"
                    >
                        Saya memahami bahwa jika tidak ada kontak referensi yang
                        tersisa, pihak pengelola kost mungkin kesulitan
                        menyampaikan informasi penting terkait saya kepada orang
                        terdekat saya.
                    </label>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            setAgree(false);
                        }}
                        disabled={!agree}
                    >
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
