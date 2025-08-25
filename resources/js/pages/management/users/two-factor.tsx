import {
    Copy,
    Eye,
    EyeOff,
    RefreshCcw,
    ScanFace,
    ShieldAlert,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ensureXsrfToken } from '@/hooks/use-confirm-password';

import { UserRow } from '.';

type TwoFADialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    user: UserRow;
};

type RequestResponse = {
    message?: string;
    codes?: string[];
    error?: boolean | string;
};

export function TwoFADialog({ open, onOpenChange, user }: TwoFADialogProps) {
    const [codes, setCodes] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState<
        'view' | 'regen' | 'disable' | null
    >(null);
    const [enabled, setEnabled] = React.useState<boolean>(
        Boolean(user.two_factor_enabled),
    );

    const handleCopyAll = async () => {
        if (!codes.length) return;
        try {
            await navigator.clipboard.writeText(codes.join('\n'));
            toast.success('Semua kode berhasil disalin');
        } catch {
            toast.error('Gagal menyalin kode');
        }
    };

    const request = async (
        mode: 'disable' | 'recovery_show' | 'recovery_regenerate',
    ): Promise<RequestResponse> => {
        const token = await ensureXsrfToken();
        const resp = await fetch(
            route('management.users.two-factor', user.id),
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': token || '',
                },
                body: JSON.stringify({ mode }),
            },
        );
        if (!resp.ok) throw new Error('Response not OK');
        return (await resp.json()) as RequestResponse;
    };

    const handleView = async () => {
        if (codes.length > 0) {
            setCodes([]);
            return;
        }
        try {
            setLoading('view');
            const data = await request('recovery_show');
            if (Array.isArray(data.codes)) {
                setCodes(data.codes);
                toast.success(
                    data.message ?? 'Recovery codes berhasil diambil',
                );
            } else {
                toast.error(data?.message ?? 'Gagal mengambil recovery codes');
            }
        } catch {
            toast.error('Gagal mengambil recovery codes');
        } finally {
            setLoading(null);
        }
    };

    const handleRegenerate = async () => {
        try {
            setLoading('regen');
            const data = await request('recovery_regenerate');
            if (Array.isArray(data.codes)) {
                setCodes(data.codes);
                toast.success(
                    data.message ?? 'Recovery codes berhasil diregenerasi',
                );
            } else {
                toast.error(
                    data?.message ?? 'Gagal meregenerasi recovery codes',
                );
            }
        } catch {
            toast.error('Gagal meregenerasi recovery codes');
        } finally {
            setLoading(null);
        }
    };

    const handleDisable = async () => {
        try {
            setLoading('disable');
            const data = await request('disable');
            if (data.error) {
                toast.error(data.message ?? 'Gagal menonaktifkan 2FA');
            } else {
                setCodes([]);
                setEnabled(false);
                toast.success(data.message ?? '2FA berhasil dinonaktifkan');
            }
        } catch {
            toast.error('Gagal menonaktifkan 2FA');
        } finally {
            setLoading(null);
        }
    };

    React.useEffect(() => {
        if (!open) {
            setCodes([]);
            setLoading(null);
        } else {
            setEnabled(Boolean(user.two_factor_enabled));
        }
    }, [open, user.id, user.two_factor_enabled]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScanFace className="h-5 w-5" />
                        Recovery Codes 2FA
                    </DialogTitle>
                    <DialogDescription>
                        Kelola recovery codes untuk <b>{user.name}</b> (
                        {user.email}). Recovery codes dapat digunakan jika user
                        kehilangan akses ke authenticator.
                    </DialogDescription>
                </DialogHeader>

                {/* User summary */}
                <div className="mb-2 mt-1 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        {user.avatar ? (
                            <AvatarImage src={user.avatar} alt={user.name} />
                        ) : (
                            <AvatarFallback>{user.initials}</AvatarFallback>
                        )}
                    </Avatar>
                    <div className="min-w-0">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                            {user.email || '—'}
                        </div>
                    </div>
                </div>

                {!enabled ? (
                    <Alert>
                        <AlertTitle>2FA belum aktif</AlertTitle>
                        <AlertDescription>
                            User ini belum mengaktifkan Two-Factor
                            Authentication.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="flex flex-col gap-3">
                        {/* Disable 2FA card */}
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="mb-1 text-sm font-medium">
                                Nonaktifkan 2FA
                            </div>
                            <p className="mb-2 text-xs text-muted-foreground">
                                Menonaktifkan 2FA akan membuat user dapat login
                                tanpa OTP. Lakukan hanya saat benar-benar
                                diperlukan.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleDisable}
                                disabled={loading !== null}
                                className="flex items-center gap-2"
                            >
                                <ShieldAlert className="h-4 w-4" />
                                {loading === 'disable'
                                    ? 'Memproses…'
                                    : 'Nonaktifkan 2FA'}
                            </Button>
                        </div>

                        {/* Combined recovery codes card */}
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="mb-1 text-sm font-medium">
                                Recovery Codes
                            </div>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Lihat atau regenerasi recovery codes. Recovery
                                codes dapat digunakan jika user kehilangan akses
                                ke authenticator. Regenerasi akan membatalkan
                                recovery codes lama dan menerbitkan yang baru.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={handleView}
                                    disabled={loading !== null}
                                    className="flex items-center gap-2"
                                >
                                    {codes.length > 0 ? (
                                        <>
                                            <EyeOff className="h-4 w-4" />
                                            Sembunyikan Recovery Codes
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4" />
                                            {loading === 'view'
                                                ? 'Mengambil…'
                                                : 'Lihat Recovery Codes'}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleRegenerate}
                                    disabled={loading !== null}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    {loading === 'regen'
                                        ? 'Memproses…'
                                        : 'Regenerasi & Tampilkan'}
                                </Button>
                            </div>

                            {codes.length > 0 && (
                                <div className="mt-4 rounded-lg border p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="text-sm font-medium">
                                            Daftar Recovery Codes
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyAll}
                                            disabled={
                                                !codes.length ||
                                                loading !== null
                                            }
                                            className="h-8"
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Salin semua
                                        </Button>
                                    </div>
                                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                        {codes.map((code, idx) => (
                                            <li
                                                key={idx}
                                                className="rounded bg-muted px-2 py-1 font-mono text-sm"
                                            >
                                                {code}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
