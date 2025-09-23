import { router } from '@inertiajs/react';
import { Eye, EyeOff, RefreshCcw, ScanFace } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
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
                            <ScanFace className="h-5 w-5" />
                            {t('user.twofa.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('user.twofa.desc')}
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
                                <div className="text-muted-foreground truncate text-xs">
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {enabled ? (
                            <>
                                <div className="space-y-2">
                                    <Label>
                                        {t('user.twofa.reason_label')}
                                    </Label>
                                    <Textarea
                                        rows={3}
                                        value={reason}
                                        onChange={(e) =>
                                            setReason(e.target.value)
                                        }
                                        placeholder={t(
                                            'user.twofa.reason_placeholder',
                                        )}
                                        maxLength={200}
                                    />
                                    <div className="text-muted-foreground mt-1 flex items-center justify-end text-[11px]">
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
                                        aria-label={t(
                                            'user.twofa.view_codes_aria',
                                        )}
                                    >
                                        {loading === 'view' ? (
                                            <EyeOff className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Eye className="mr-2 h-4 w-4" />
                                        )}
                                        {t('user.twofa.view_codes')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setConfirmOpen(true)}
                                        disabled={
                                            loading === 'disable' || !rule.valid
                                        }
                                        aria-label={t(
                                            'user.twofa.disable_aria',
                                        )}
                                    >
                                        {t('security.2fa.disable')}
                                    </Button>
                                </div>
                            </>
                        ) : null}

                        {viewing ? (
                            <div className="rounded-md border p-3">
                                <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
                                    <span>
                                        {codes.length > 0
                                            ? t('user.twofa.recovery_available')
                                            : t('user.twofa.no_recovery')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {codes.length === 0 ? (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleRegenerate}
                                                disabled={loading === 'regen'}
                                                aria-label={t(
                                                    'security.2fa.recovery.regen',
                                                )}
                                            >
                                                <RefreshCcw className="mr-2 h-4 w-4" />{' '}
                                                {t(
                                                    'security.2fa.recovery.regen',
                                                )}
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                                {codes.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-muted-foreground text-xs">
                                            {t('user.twofa.recovery_hint')}
                                        </p>
                                        <div className="flex items-center justify-between rounded-md border p-2 font-mono text-xs">
                                            <span>{codes[0]}</span>
                                            <CopyInline
                                                value={codes[0]}
                                                variant="icon"
                                                size="xs"
                                                aria-label={`${t('common.copy')} ${codes[0]}`}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground text-xs">
                                        {t('user.twofa.generate_hint')}
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
                            {t('user.twofa.disable_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('user.twofa.disable_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 text-sm">
                        <div className="text-muted-foreground">
                            {t('common.user')}:
                            <span className="text-foreground font-medium">
                                {user.name}
                            </span>{' '}
                            ({user.email})
                        </div>
                        {reason.trim() ? (
                            <div className="bg-muted/30 rounded-md border p-2 text-xs">
                                {t('invoice.reason')}: {reason.trim()}
                            </div>
                        ) : null}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDisable}
                            disabled={loading === 'disable'}
                        >
                            {t('user.twofa.disable_now')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
