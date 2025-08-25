'use client';

import { Copy, KeyRound, Link2, Mail } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ensureXsrfToken } from '@/hooks/use-confirm-password';

import { UserRow } from '.';

type ResetDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserRow;
};

type ResetState = {
    generatedUrl: string;
    copied: boolean;
    loading: 'send' | 'generate' | null;
};

export function ResetPasswordDialog({
    open,
    onOpenChange,
    user,
}: ResetDialogProps) {
    const [state, setState] = React.useReducer(
        (s: ResetState, a: Partial<ResetState>) => ({ ...s, ...a }),
        { generatedUrl: '', copied: false, loading: null },
    );
    const { generatedUrl, copied, loading } = state;
    const isBusy = loading !== null;
    const timeoutRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        if (!open) {
            setState({ generatedUrl: '', copied: false, loading: null });
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [open]);

    const request = React.useCallback(
        async (mode: 'send' | 'generate') => {
            const token = await ensureXsrfToken();
            if (!token) throw new Error('Missing CSRF token');
            const resp = await fetch(
                route('management.users.password.reset', user.id),
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ mode }),
                },
            );
            if (!resp.ok) throw new Error('Response not OK');
            return resp.json() as Promise<{
                message?: string;
                reset_url?: string;
                error?: boolean;
            }>;
        },
        [user.id],
    );

    const handleSendEmail = React.useCallback(async () => {
        if (!user.email) {
            toast.error('Pengguna tidak memiliki email');
            return;
        }
        setState({ loading: 'send' });
        try {
            const data = await request('send');
            if (data.error) {
                toast.error(data.message ?? 'Gagal mengirim tautan reset');
            } else {
                toast.success(
                    data.message ?? 'Tautan reset dikirim ke email pengguna',
                );
            }
        } catch {
            toast.error('Gagal mengirim tautan reset');
        } finally {
            setState({ loading: null });
        }
    }, [request, user.email]);

    const handleGenerate = React.useCallback(async () => {
        setState({ loading: 'generate' });
        try {
            const data = await request('generate');
            if (data.error) {
                toast.error(data.message ?? 'Gagal generate tautan reset');
            } else if (data.reset_url) {
                setState({ generatedUrl: data.reset_url, copied: false });
                toast.success(
                    data.message ?? 'Tautan reset berhasil digenerate',
                );
            }
        } catch {
            toast.error('Gagal generate tautan reset');
        } finally {
            setState({ loading: null });
        }
    }, [request]);

    const copy = React.useCallback(async () => {
        if (!generatedUrl) return;
        try {
            await navigator.clipboard.writeText(generatedUrl);
            setState({ copied: true });
            toast.success('Link disalin ke clipboard');
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => {
                setState({ copied: false });
                timeoutRef.current = null;
            }, 1800);
        } catch {
            toast.error('Gagal menyalin link');
        }
    }, [generatedUrl]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Reset Password
                    </DialogTitle>
                    <DialogDescription>
                        Kirim tautan reset ke email atau generate tautan sekali
                        pakai untuk dibagikan manual.
                    </DialogDescription>
                </DialogHeader>

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

                <Separator className="my-1" />

                <div className="space-y-1.5">
                    <div className="text-sm font-medium">Kirim lewat email</div>
                    <Button
                        type="button"
                        onClick={handleSendEmail}
                        disabled={isBusy || !user.email}
                        className="w-full"
                    >
                        <Mail className="mr-2 h-4 w-4" />{' '}
                        {loading === 'send'
                            ? 'Mengirim…'
                            : 'Kirim tautan ke email'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Tautan akan dikirim ke{' '}
                        <span className="font-medium">{user.email || '—'}</span>{' '}
                        dan berlaku dalam waktu terbatas.
                    </p>
                </div>

                <Separator className="my-1" />

                <div className="mt-2 space-y-2">
                    <div className="text-sm font-medium">
                        Generate tautan reset password
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Cocok saat email pengguna tidak dapat diakses. Tautan
                        bersifat{' '}
                        <span className="font-medium">sekali pakai</span> dan
                        akan
                        <span className="font-medium">
                            {' '}
                            kedaluwarsa otomatis
                        </span>
                        .
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGenerate}
                            disabled={isBusy}
                            className="flex-1"
                        >
                            <Link2 className="mr-2 h-4 w-4" />
                            {generatedUrl
                                ? 'Generate ulang'
                                : loading === 'generate'
                                  ? 'Memproses…'
                                  : 'Generate tautan'}
                        </Button>
                    </div>

                    {generatedUrl && (
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Tautan yang bisa dibagikan
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={generatedUrl}
                                    className="font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    variant={copied ? 'default' : 'outline'}
                                    onClick={copy}
                                >
                                    {copied ? (
                                        'Disalin'
                                    ) : (
                                        <>
                                            <Copy className="mr-1.5 h-4 w-4" />{' '}
                                            Salin
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Bagikan ke pengguna melalui kanal yang tersedia.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ResetPasswordDialog;
