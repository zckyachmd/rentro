import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MonitorSmartphone, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

type SessionItem = {
    id: string;
    agent?: string;
    ip_address?: string;
    last_active?: string;
    current?: boolean;
};

type SessionsTabProps = {
    sessions: SessionItem[];
};

export function SessionsTab({ sessions }: SessionsTabProps) {
    const [showRevokePassword, setShowRevokePassword] = useState(false);
    const revokeForm = useForm<{ current_password: string }>({ current_password: '' });

    const onRevokeOthers = (e: React.FormEvent) => {
        e.preventDefault();
        revokeForm.post(route('security.sessions.revokeOthers'), {
            preserveScroll: true,
            onSuccess: () => {
                revokeForm.reset('current_password');
                toast.success('Berhasil logout dari semua sesi lain.');
            },
            onError: () => toast.error('Gagal melakukan logout dari sesi lain.'),
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
                                                {s.agent ?? 'Perangkat'}
                                            </div>
                                            <div className="text-muted-foreground">
                                                IP {s.ip_address ?? '—'} • Aktif {s.last_active ?? '—'}
                                            </div>
                                        </div>
                                    </div>
                                    {s.current && (
                                        <Badge>
                                            Aktif Saat Ini
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Separator />

                <form
                    onSubmit={onRevokeOthers}
                    className="space-y-3"
                >
                    <div className="space-y-2">
                        <Label htmlFor="revoke_password">
                            Konfirmasi Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="revoke_password"
                                type={showRevokePassword ? 'text' : 'password'}
                                value={revokeForm.data.current_password}
                                className="pr-10"
                                onChange={(e) =>
                                    revokeForm.setData(
                                        'current_password',
                                        e.target.value,
                                    )
                                }
                                placeholder="Password saat ini"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    setShowRevokePassword((s) => !s)
                                }
                                className="absolute right-0 top-0 h-full border-0 px-3 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                tabIndex={-1}
                                aria-label={
                                    showRevokePassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                            >
                                {showRevokePassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {revokeForm.errors.current_password && (
                            <p className="text-sm text-destructive">
                                {revokeForm.errors.current_password}
                            </p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        variant="destructive"
                        disabled={revokeForm.processing}
                    >
                        Logout dari semua sesi lain
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
