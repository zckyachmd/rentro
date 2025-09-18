'use client';

import { router, useForm } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

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

import { UserItem } from '..';

type ForceLogoutDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserItem;
};

export default function ForceLogoutDialog({
    open,
    onOpenChange,
    user,
}: ForceLogoutDialogProps) {
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
            onSuccess: (page) => {
                const flash = (page.props as { flash?: { success?: string } })
                    .flash;
                if (flash?.success) toast.success(flash.success);
                onOpenChange(false);
            },
            onError: (errs) => {
                const message =
                    errs.scope?.[0] ||
                    errs.reason?.[0] ||
                    'Gagal mencabut sesi pengguna';
                toast.error(message);
            },
            onFinish: () => setSubmitting(false),
        });
    }, [user, data.scope, data.reason, onOpenChange, submitting]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Cabut Sesi Pengguna</DialogTitle>
                    <DialogDescription>
                        Paksa keluar dari semua perangkat atau selain perangkat
                        saat ini.
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
                            <div className="truncate text-xs text-muted-foreground">
                                {user.email}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Target</Label>
                        <RadioGroup
                            value={data.scope}
                            onValueChange={(v: 'all' | 'all_except_current') =>
                                setData('scope', v)
                            }
                        >
                            <label className="flex items-center gap-2">
                                <RadioGroupItem value="all" />
                                <span className="text-sm">Semua perangkat</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <RadioGroupItem value="all_except_current" />
                                <span className="text-sm">
                                    Semua kecuali perangkat saat ini
                                </span>
                            </label>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>Alasan (opsional)</Label>
                        <Textarea
                            rows={3}
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="Opsional"
                        />
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                            <AlertTriangle className="mr-1 inline-block h-4 w-4" />{' '}
                            Tindakan ini tidak dapat dibatalkan.
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={submitting}
                        onClick={onSubmit}
                    >
                        Cabut Sesi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
