import { router } from '@inertiajs/react';
import { Eye, EyeOff, RefreshCcw, ScanFace } from 'lucide-react';
import * as React from 'react';

// removed status alert per request

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useLengthRule } from '@/hooks/use-length-rule';
import { postJson } from '@/lib/api';
import type { RequestResponse, TwoFADialogProps } from '@/types/management';

export function TwoFADialog({
    open,
    onOpenChange,
    user,
    autoReload = true,
}: TwoFADialogProps) {
    const [codes, setCodes] = React.useState<string[]>([]);
    const [viewing, setViewing] = React.useState(false);
    const [loading, setLoading] = React.useState<
        'view' | 'regen' | 'disable' | null
    >(null);
    const [enabled, setEnabled] = React.useState<boolean>(
        Boolean(user.two_factor_enabled),
    );

    const [reason, setReason] = React.useState('');
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const rule = useLengthRule(reason, { min: 20, max: 200, required: true });
    const resetGate = React.useCallback(() => {
        setReason('');
    }, []);

    const request = async (
        mode: 'recovery_show' | 'recovery_regenerate',
    ): Promise<RequestResponse> =>
        postJson<RequestResponse>(
            route('management.users.two-factor', user.id),
            { mode, reason: reason.trim() },
        );

    const handleView = async () => {
        if (!enabled) return;
        if (viewing) {
            setViewing(false);
            setCodes([]);
            return;
        }
        try {
            setLoading('view');
            const data = await request('recovery_show');
            if (Array.isArray(data.codes)) {
                setCodes(data.codes);
            }
            setViewing(true);
            resetGate();
        } catch {
            // ignore
        } finally {
            setLoading(null);
        }
    };

    const handleRegenerate = async () => {
        if (!enabled) return;
        try {
            setLoading('regen');
            const data = await request('recovery_regenerate');
            if (Array.isArray(data.codes)) {
                setCodes(data.codes);
            }
            // do not reset reason gate here, since reason is optional for regenerate
        } catch {
            // ignore
        } finally {
            setLoading(null);
        }
    };

    const handleDisable = async () => {
        if (!enabled) return;
        if (!rule.valid) return;
        setLoading('disable');
        router.post(
            route('management.users.two-factor', user.id),
            { mode: 'disable', reason: reason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEnabled(false);
                    if (autoReload) router.reload({ preserveUrl: true });
                    onOpenChange(false);
                },
                onFinish: () => setLoading(null),
            },
        );
    };

    React.useEffect(() => {
        if (!open) {
            setCodes([]);
            setViewing(false);
            setReason('');
            setLoading(null);
            setConfirmOpen(false);
        }
    }, [open]);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ScanFace className="h-5 w-5" /> Two-Factor
                            Authentication
                        </DialogTitle>
                        <DialogDescription>
                            Kelola recovery codes dan status 2FA
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                {user.avatar ? (
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                    />
                                ) : (
                                    <AvatarFallback>
                                        {user.initials}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="min-w-0">
                                <div className="truncate font-medium">
                                    {user.name}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {enabled ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Alasan tindakan</Label>
                                    <Textarea
                                        rows={3}
                                        value={reason}
                                        onChange={(e) =>
                                            setReason(e.target.value)
                                        }
                                        placeholder="Contoh: Pengguna kehilangan perangkat otentikasi"
                                        maxLength={200}
                                    />
                                    <div className="mt-1 flex items-center justify-end text-[11px] text-muted-foreground">
                                        <span>
                                            {rule.length}/
                                            {rule.length < 20 ? 20 : 200}
                                            {rule.length < 20 ? '*' : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={handleView}
                                        disabled={
                                            loading === 'view' || !rule.valid
                                        }
                                        aria-label="Lihat kode pemulihan"
                                    >
                                        {loading === 'view' ? (
                                            <EyeOff className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Eye className="mr-2 h-4 w-4" />
                                        )}
                                        Lihat Kode
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setConfirmOpen(true)}
                                        disabled={
                                            loading === 'disable' || !rule.valid
                                        }
                                        aria-label="Nonaktifkan two-factor authentication"
                                    >
                                        Nonaktifkan 2FA
                                    </Button>
                                </div>
                            </>
                        ) : null}

                        {viewing ? (
                            <div className="rounded-md border p-3">
                                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        {codes.length > 0
                                            ? 'Kode pemulihan tersedia'
                                            : 'Belum ada kode pemulihan'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {codes.length === 0 ? (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleRegenerate}
                                                disabled={loading === 'regen'}
                                                aria-label="Generate kode pemulihan"
                                            >
                                                <RefreshCcw className="mr-2 h-4 w-4" />{' '}
                                                Generate Kode
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                                {codes.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                            Ini adalah salah satu kode pemulihan
                                            Anda. Simpan dan rahasiakan kode
                                            ini. Jangan bagikan kepada siapa
                                            pun.
                                        </p>
                                        <div className="flex items-center justify-between rounded-md border p-2 font-mono text-xs">
                                            <span>{codes[0]}</span>
                                            <CopyInline
                                                value={codes[0]}
                                                variant="icon"
                                                size="xs"
                                                aria-label={`Salin ${codes[0]}`}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground">
                                        Klik Generate Kode untuk membuat kode
                                        pemulihan baru.
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Nonaktifkan Two-Factor Authentication
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menonaktifkan 2FA untuk pengguna
                            ini. Pengguna dapat mengaktifkannya kembali dengan
                            melakukan setup ulang 2FA melalui menu keamanan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 text-sm">
                        <div className="text-muted-foreground">
                            Pengguna:{' '}
                            <span className="font-medium text-foreground">
                                {user.name}
                            </span>{' '}
                            ({user.email})
                        </div>
                        {reason.trim() ? (
                            <div className="rounded-md border bg-muted/30 p-2 text-xs">
                                Alasan: {reason.trim()}
                            </div>
                        ) : null}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDisable}
                            disabled={loading === 'disable'}
                        >
                            Nonaktifkan sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
