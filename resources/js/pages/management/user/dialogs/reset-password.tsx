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
import type { ResetDialogProps, ResetState } from '@/types/management';

export function ResetPasswordDialog({
    open,
    onOpenChange,
    user,
}: ResetDialogProps) {
    const [state, setState] = React.useReducer(
        (s: ResetState, a: Partial<ResetState>) => ({ ...s, ...a }),
        {
            generatedUrl: '',
            copied: false,
            loading: null,
        },
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
            return (await resp.json()) as {
                message?: string;
                reset_url?: string;
                error?: boolean;
            };
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
            if (data.error)
                toast.error(data.message ?? 'Gagal mengirim tautan reset');
            else
                toast.success(
                    data.message ?? 'Tautan reset dikirim ke email pengguna',
                );
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
            if (data.error)
                toast.error(data.message ?? 'Gagal generate tautan reset');
            else if (data.reset_url) {
                setState({ generatedUrl: data.reset_url, copied: false });
                toast.success(data.message ?? 'Tautan reset berhasil dibuat');
            }
        } catch {
            toast.error('Gagal generate tautan reset');
        } finally {
            setState({ loading: null });
        }
    }, [request]);

    const handleCopy = React.useCallback(async () => {
        if (!generatedUrl) return;
        await navigator.clipboard.writeText(generatedUrl);
        setState({ copied: true });
        toast.success('Disalin ke clipboard');
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(
            () => setState({ copied: false }),
            1000,
        );
    }, [generatedUrl]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" /> Reset Password
                    </DialogTitle>
                    <DialogDescription>
                        Kirim atau buat tautan reset password
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
                    <div className="grid gap-2">
                        <Button
                            type="button"
                            onClick={handleSendEmail}
                            disabled={isBusy}
                        >
                            <Mail className="mr-2 h-4 w-4" /> Kirim Email
                        </Button>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                            <Input
                                readOnly
                                value={generatedUrl}
                                placeholder="Tautan reset akan muncul di sini"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGenerate}
                                disabled={isBusy}
                            >
                                <Link2 className="mr-2 h-4 w-4" /> Buat Tautan
                            </Button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                                Link dapat dibagikan langsung ke user
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={handleCopy}
                                disabled={!generatedUrl}
                            >
                                <Copy className="mr-1 h-3.5 w-3.5" />{' '}
                                {copied ? 'Disalin' : 'Salin'}
                            </Button>
                        </div>
                    </div>
                    <Separator />
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ResetPasswordDialog;
