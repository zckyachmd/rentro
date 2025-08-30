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

import { UserItem } from '.';

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
    }>({
        scope: 'all',
        reason: '',
    });

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
            data: {
                scope: data.scope,
                reason: data.reason.trim() || null,
            },
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
                    <DialogTitle>Paksa Keluar Sesi</DialogTitle>
                    <DialogDescription>
                        Tindakan ini akan menghapus token sesi pengguna{' '}
                        <strong>{user.name}</strong> dari server. Pengguna harus
                        login ulang di perangkat mereka.
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-3 flex items-center gap-3">
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
                            {user.email}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-sm">
                            Gunakan fitur ini dengan hati-hati. Revoke seluruh
                            sesi akan berdampak ke semua perangkat yang sedang
                            login.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Aksi yang akan dilakukan</Label>
                        <RadioGroup
                            value={data.scope}
                            onValueChange={(val) =>
                                setData(
                                    'scope',
                                    val as 'all' | 'all_except_current',
                                )
                            }
                            className="grid gap-2 md:grid-cols-2"
                        >
                            <div className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem
                                    value="all"
                                    id="scope-all"
                                    disabled={submitting}
                                />
                                <Label
                                    htmlFor="scope-all"
                                    className="cursor-pointer"
                                >
                                    Semua sesi
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem
                                    value="all_except_current"
                                    id="scope-except"
                                    disabled={submitting}
                                />
                                <Label
                                    htmlFor="scope-except"
                                    className="cursor-pointer"
                                >
                                    Semua sesi kecuali sesi saat ini
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Alasan (opsional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Contoh: Keamanan akun, perangkat hilang, dll."
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            rows={4}
                            disabled={submitting}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Memproses…' : 'Paksa Keluar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
