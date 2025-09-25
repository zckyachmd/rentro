import { router, useForm } from '@inertiajs/react';
import { LogOut, MonitorSmartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
import type { SessionItem, SessionsTabProps } from '@/types/security';

export function SessionsTab({ sessions }: SessionsTabProps) {
    const { t } = useTranslation();
    const { t: tSecurity } = useTranslation('security');
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
            },
        );
    };

    const onDestroyOne = (id: string) => {
        destroyForm.delete(route('security.sessions.destroy', id), {
            preserveScroll: true,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{tSecurity('tabs.sessions')}</CardTitle>
                <CardDescription>{tSecurity('sessions.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                        {tSecurity('sessions.count', {
                            count: sessions.length,
                        })}
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => confirmGuard(onConfirmRevokeOthers)}
                        disabled={destroyForm.processing}
                    >
                        {tSecurity('sessions.revoke_others')}
                    </Button>
                </div>

                <div className="space-y-2">
                    {sessions.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            {tSecurity('sessions.empty')}
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
                                                    tSecurity('sessions.device')}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {tSecurity('sessions.ip_active', { ip: s.ip_address ?? '—', last_active: s.last_active ?? '—' })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {s.current ? (
                                            <Badge>
                                                {tSecurity('sessions.current')}
                                            </Badge>
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
                                                {t('nav.logout')}
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
