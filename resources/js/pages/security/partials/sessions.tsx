import ConfirmPasswordDialog, {
    useConfirmPasswordModal,
} from '@/components/confirm-password';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { router, useForm } from '@inertiajs/react';
import { LogOut, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';

type SessionItem = {
    id: string;
    agent?: string;
    agent_label?: string;
    ip_address?: string;
    last_active?: string;
    current?: boolean;
};

type SessionsTabProps = {
    sessions: SessionItem[];
};

export function SessionsTab({ sessions }: SessionsTabProps) {
    const destroyForm = useForm({});

    const { open, setOpen, openConfirm, handleConfirmed } =
        useConfirmPasswordModal();
    const confirmGuard = openConfirm;

    const onConfirmRevokeOthers = () => {
        router.post(
            route('security.sessions.revokeOthers'),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Berhasil logout dari semua sesi lain.'),
                onError: () =>
                    toast.error('Gagal melakukan logout dari sesi lain.'),
            },
        );
    };

    const onDestroyOne = (id: string) => {
        destroyForm.delete(route('security.sessions.destroy', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Sesi berhasil di-logout.'),
            onError: () => toast.error('Gagal logout sesi.'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sesi & Perangkat</CardTitle>
                <CardDescription>
                    Lihat sesi aktif dan cabut akses perangkat lain.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {sessions.length} sesi aktif terdaftar
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => confirmGuard(onConfirmRevokeOthers)}
                        disabled={destroyForm.processing}
                    >
                        Logout dari semua sesi lain
                    </Button>
                </div>

                <div className="space-y-2">
                    {sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Belum ada data sesi yang ditampilkan.
                        </p>
                    ) : (
                        <div className="divide-y rounded-md border">
                            {sessions.map((s: SessionItem) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between p-3 text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <MonitorSmartphone className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">
                                                {s.agent_label ??
                                                    s.agent ??
                                                    'Perangkat'}
                                            </div>
                                            <div className="text-muted-foreground">
                                                IP {s.ip_address ?? '—'} • Aktif{' '}
                                                {s.last_active ?? '—'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {s.current ? (
                                            <Badge>Aktif Saat Ini</Badge>
                                        ) : (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={
                                                    destroyForm.processing
                                                }
                                                onClick={() =>
                                                    confirmGuard(() =>
                                                        onDestroyOne(s.id),
                                                    )
                                                }
                                                className="flex items-center gap-1"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Logout
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <ConfirmPasswordDialog
                    open={open}
                    onOpenChange={setOpen}
                    onConfirmed={handleConfirmed}
                />
            </CardContent>
        </Card>
    );
}
