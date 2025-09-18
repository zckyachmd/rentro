import { router } from '@inertiajs/react';
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

import { UserItem } from '..';

type TwoFADialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    user: UserItem;
    autoReload?: boolean;
};

type RequestResponse = {
    message?: string;
    codes?: string[];
    error?: boolean | string;
};

export function TwoFADialog({
    open,
    onOpenChange,
    user,
    autoReload = true,
}: TwoFADialogProps) {
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
            if (!data.error) {
                toast.success(
                    data.message ?? 'Two-factor authentication dinonaktifkan',
                );
                setEnabled(false);
                if (autoReload) router.reload({ preserveUrl: true });
                onOpenChange(false);
            } else {
                toast.error(data.message ?? 'Gagal menonaktifkan two-factor');
            }
        } catch {
            toast.error('Gagal menonaktifkan two-factor');
        } finally {
            setLoading(null);
        }
    };

    return (
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
                                <AvatarFallback>{user.initials}</AvatarFallback>
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

                    <Alert>
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Status</AlertTitle>
                        <AlertDescription>
                            {enabled
                                ? 'Two-factor aktif'
                                : 'Two-factor nonaktif'}
                        </AlertDescription>
                    </Alert>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleView}
                            disabled={loading === 'view'}
                        >
                            {loading === 'view' ? (
                                <EyeOff className="mr-2 h-4 w-4" />
                            ) : (
                                <Eye className="mr-2 h-4 w-4" />
                            )}{' '}
                            Lihat Kode
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRegenerate}
                            disabled={loading === 'regen'}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" /> Regenerasi
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDisable}
                            disabled={loading === 'disable'}
                        >
                            Nonaktifkan 2FA
                        </Button>
                        {codes.length > 0 ? (
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleCopyAll}
                            >
                                <Copy className="mr-2 h-4 w-4" /> Salin Semua
                            </Button>
                        ) : null}
                    </div>

                    {codes.length > 0 ? (
                        <div className="rounded-md border p-3 font-mono text-xs">
                            {codes.map((c) => (
                                <div key={c}>{c}</div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
