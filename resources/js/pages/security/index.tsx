import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuthLayout from '@/layouts/auth-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { KeyRound, MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import TwoFactorTab from './partials/2fa';
import PasswordTab from './partials/password';
import { SessionsTab } from './partials/sessions';

type SessionItem = {
    id: string;
    agent?: string;
    ip_address?: string;
    last_active?: string;
    current?: boolean;
};

type Summary = {
    email_verified?: boolean;
    two_factor_enabled?: boolean;
    last_password_changed_at?: string | null;
};

type PageProps = {
    status?: string | null;
    summary?: Summary;
    sessions?: SessionItem[];
};

const TAB_KEYS = ['password', '2fa', 'sessions'] as const;
type TabKey = (typeof TAB_KEYS)[number];

function getTabFromUrl(): TabKey {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t');
    return (TAB_KEYS as readonly string[]).includes(t ?? '')
        ? (t as TabKey)
        : 'password';
}

function setTabInUrl(value: TabKey) {
    const url = new URL(window.location.href);
    url.searchParams.set('t', value);
    window.history.replaceState({}, '', url.toString());
}

export default function SecurityIndex() {
    const page = usePage<PageProps>();
    const summary: Summary = (page?.props?.summary ?? {}) as Summary;
    const sessions: SessionItem[] = (page?.props?.sessions ??
        []) as SessionItem[];

    const [tab, setTab] = useState<TabKey>(() => getTabFromUrl());

    const [verifyOpen, setVerifyOpen] = useState(false);
    const [sending, setSending] = useState(false);

    const handleResendVerification = () => {
        setSending(true);
        router.post(
            route('verification.send'),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Email verifikasi telah dikirim.');
                    setVerifyOpen(false);
                },
                onError: () => {
                    toast.error('Gagal mengirim email verifikasi. Coba lagi.');
                },
                onFinish: () => setSending(false),
            },
        );
    };

    useEffect(() => {
        const syncFromUrl = () => setTab(getTabFromUrl());
        syncFromUrl();
        window.addEventListener('popstate', syncFromUrl);
        return () => window.removeEventListener('popstate', syncFromUrl);
    }, []);

    useEffect(() => {
        setTabInUrl(tab);
    }, [tab]);

    return (
        <AuthLayout
            pageTitle="Keamanan Akun"
            pageDescription="Kelola password, autentikasi dua langkah, dan sesi/perangkat yang terhubung."
            breadcrumbs={[{ label: 'Akun', href: '#' }, { label: 'Keamanan' }]}
        >
            <Head title="Keamanan Akun" />

            {/* Summary */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MailCheck className="h-4 w-4" /> Verifikasi Email
                        </CardTitle>
                        <CardDescription>
                            Status verifikasi alamat email Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <Badge
                            variant={
                                summary.email_verified ? 'default' : 'secondary'
                            }
                        >
                            {summary.email_verified
                                ? 'Terverifikasi'
                                : 'Belum diverifikasi'}
                        </Badge>
                        {!summary.email_verified && (
                            <Dialog
                                open={verifyOpen}
                                onOpenChange={setVerifyOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8"
                                    >
                                        Kirim Ulang
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="animate-none">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Kirim ulang email verifikasi?
                                        </DialogTitle>
                                        <DialogDescription>
                                            Kami akan mengirim email verifikasi
                                            ke alamat email akun Anda.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setVerifyOpen(false)}
                                            disabled={sending}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            onClick={handleResendVerification}
                                            disabled={sending}
                                        >
                                            {sending
                                                ? 'Mengirim…'
                                                : 'Kirim email verifikasi'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            Autentikasi 2 Langkah
                        </CardTitle>
                        <CardDescription>
                            Amankan akun dengan kode tambahan saat login.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <Badge
                            variant={
                                summary.two_factor_enabled
                                    ? 'default'
                                    : 'secondary'
                            }
                        >
                            {summary.two_factor_enabled ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTab('2fa')}
                        >
                            Kelola
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <KeyRound className="h-4 w-4" /> Password
                        </CardTitle>
                        <CardDescription>
                            Ganti password Anda secara berkala.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Terakhir diubah:{' '}
                            {summary.last_password_changed_at
                                ? summary.last_password_changed_at
                                : '—'}
                        </div>
                        <Button size="sm" onClick={() => setTab('password')}>
                            Ubah
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as typeof tab)}
                className="w-full"
            >
                <TabsList className="mb-4">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="2fa">2FA</TabsTrigger>
                    <TabsTrigger value="sessions">Sesi & Perangkat</TabsTrigger>
                </TabsList>

                {/* Password Tab */}
                <TabsContent value="password" className="space-y-4">
                    <PasswordTab />
                </TabsContent>

                {/* 2FA Tab */}
                <TabsContent value="2fa" className="space-y-4">
                    <TwoFactorTab summary={summary} />
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="sessions" className="space-y-4">
                    <SessionsTab sessions={sessions} />
                </TabsContent>
            </Tabs>
        </AuthLayout>
    );
}
