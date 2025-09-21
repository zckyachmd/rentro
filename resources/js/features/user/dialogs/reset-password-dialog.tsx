'use client';

import { router } from '@inertiajs/react';
import { Copy, KeyRound, Link2, Mail } from 'lucide-react';
import * as React from 'react';

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
    const { generatedUrl, loading } = state;
    const isBusy = loading !== null;
    const timeoutRef = React.useRef<number | null>(null);
    const [reason, setReason] = React.useState('');

    const rule = useLengthRule(reason, { min: 20, max: 200, required: true });

    React.useEffect(() => {
        if (!open) {
            setState({ generatedUrl: '', copied: false, loading: null });
            setReason('');
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

    const handleSendEmail = React.useCallback(() => {
        if (!rule.valid) return;
        setState({ loading: 'send' });
        router.post(
            route('management.users.password.reset', user.id),
            { mode: 'send', reason: reason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onFinish: () => setState({ loading: null }),
            },
        );
    }, [user.id, reason, rule.valid, onOpenChange]);

    const handleGenerate = React.useCallback(async () => {
        if (!rule.valid) return;
        setState({ loading: 'generate' });
        try {
            const data = await postJson<{
                message?: string;
                reset_url?: string;
            }>(route('management.users.password.reset', user.id), {
                mode: 'generate',
                reason: reason.trim(),
            });
            if (data?.reset_url) setState({ generatedUrl: data.reset_url });
        } catch {
            // ignore;
        } finally {
            setState({ loading: null });
        }
    }, [user.id, reason, rule.valid]);

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
                    {generatedUrl ? (
                        <div className="grid gap-3">
                            <p className="text-sm text-muted-foreground">
                                Tautan reset berhasil dibuat. Salin tautan di
                                bawah ini dan kirimkan ke pengguna dengan cara
                                yang aman.
                            </p>
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                <input
                                    readOnly
                                    value={generatedUrl}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none"
                                />
                                <CopyInline
                                    value={generatedUrl}
                                    as="button"
                                    className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Copy className="h-4 w-4" /> Salin
                                </CopyInline>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Separator className="my-3" />
                            <div className="grid gap-2">
                                <Label>Alasan</Label>
                                <Textarea
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Contoh: Pengguna lupa password dan membutuhkan akses segera"
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
                            <div className="grid gap-2">
                                <Button
                                    type="button"
                                    onClick={handleSendEmail}
                                    disabled={isBusy || !rule.valid}
                                >
                                    <Mail className="mr-2 h-4 w-4" /> Kirim
                                    Email
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGenerate}
                                    disabled={isBusy || !rule.valid}
                                >
                                    <Link2 className="mr-2 h-4 w-4" /> Generate
                                    Reset Tautan
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ResetPasswordDialog;
