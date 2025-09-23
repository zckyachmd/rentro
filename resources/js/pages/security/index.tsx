import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import { KeyRound, MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import type { PageProps, SessionItem, Summary, TabKey } from '@/types/security';
import { TAB_KEYS } from '@/types/security';

import TwoFactorTab from './2fa';
import PasswordTab from './password';
import { SessionsTab } from './sessions';

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
    const { t } = useTranslation();
    const page = usePage<InertiaPageProps & PageProps>();
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
                    setVerifyOpen(false);
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
            pageTitle={t('security.title')}
            pageDescription={t('security.desc')}
        >
            <Head title={t('security.title')} />

            {/* Summary */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MailCheck className="h-4 w-4" />{' '}
                            {t('security.email.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('security.email.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <Badge
                            variant={
                                summary.email_verified ? 'default' : 'secondary'
                            }
                        >
                            {summary.email_verified
                                ? t('security.email.verified')
                                : t('security.email.unverified')}
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
                                        {t('security.resend')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="animate-none">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {t('security.email.resend_title')}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {t('security.email.resend_desc')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setVerifyOpen(false)}
                                            disabled={sending}
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            onClick={handleResendVerification}
                                            disabled={sending}
                                        >
                                            {sending
                                                ? t('security.sending')
                                                : t(
                                                      'security.email.resend_button',
                                                  )}
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
                            {t('security.2fa.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('security.2fa.desc')}
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
                            {summary.two_factor_enabled
                                ? t('security.enabled')
                                : t('security.disabled')}
                        </Badge>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTab('2fa')}
                        >
                            {t('common.manage')}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <KeyRound className="h-4 w-4" />{' '}
                            {t('security.password.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('security.password.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="text-muted-foreground text-sm">
                            {t('security.password.last_changed')}{' '}
                            {summary.last_password_changed_at
                                ? summary.last_password_changed_at
                                : '—'}
                        </div>
                        <Button size="sm" onClick={() => setTab('password')}>
                            {t('common.change')}
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
                    <TabsTrigger value="password">
                        {t('security.tabs.password')}
                    </TabsTrigger>
                    <TabsTrigger value="2fa">
                        {t('security.tabs.2fa')}
                    </TabsTrigger>
                    <TabsTrigger value="sessions">
                        {t('security.tabs.sessions')}
                    </TabsTrigger>
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
