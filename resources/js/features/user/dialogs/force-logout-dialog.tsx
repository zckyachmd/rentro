'use client';

import { router, useForm } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { ForceLogoutDialogProps } from '@/types/management';

export default function ForceLogoutDialog({
    open,
    onOpenChange,
    user,
}: ForceLogoutDialogProps) {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = React.useState(false);
    const { data, setData, reset } = useForm<{
        scope: 'all' | 'all_except_current';
        reason: string;
    }>({ scope: 'all', reason: '' });

    React.useEffect(() => {
        if (!open) {
            reset('reason');
            setData('scope', 'all');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const onSubmit = React.useCallback(() => {
        if (!user || submitting) return;
        setSubmitting(true);
        router.delete(route('management.users.force-logout', user.id), {
            data: { scope: data.scope, reason: data.reason.trim() || null },
            onSuccess: () => {
                onOpenChange(false);
            },
            onFinish: () => setSubmitting(false),
        });
    }, [user, data.scope, data.reason, onOpenChange, submitting]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{t('user.force_logout.title')}</DialogTitle>
                    <DialogDescription>
                        {t('user.force_logout.desc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                            <div className="text-muted-foreground truncate text-xs">
                                {user.email}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('user.force_logout.target')}</Label>
                        <RadioGroup
                            value={data.scope}
                            onValueChange={(v: 'all' | 'all_except_current') =>
                                setData('scope', v)
                            }
                        >
                            <label className="flex items-center gap-2">
                                <RadioGroupItem value="all" />
                                <span className="text-sm">
                                    {t('user.force_logout.scope.all')}
                                </span>
                            </label>
                            <label className="flex items-center gap-2">
                                <RadioGroupItem value="all_except_current" />
                                <span className="text-sm">
                                    {t(
                                        'user.force_logout.scope.all_except_current',
                                    )}
                                </span>
                            </label>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('invoice.reason')}</Label>
                        <Textarea
                            rows={3}
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder={t('payment.form.note_placeholder')}
                        />
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                            <AlertTriangle className="mr-1 inline-block h-4 w-4" />{' '}
                            {t('common.irreversible')}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={submitting}
                        onClick={onSubmit}
                    >
                        {t('user.force_logout.submit')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
