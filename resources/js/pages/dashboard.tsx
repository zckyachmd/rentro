import { Head } from '@inertiajs/react';
import { Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AuthLayoutLayout from '@/layouts/auth-layout';

export default function Dashboard() {
    const { t } = useTranslation();
    return (
        <AuthLayoutLayout
            pageTitle={t('dashboard.title')}
            pageDescription={t('dashboard.desc')}
        >
            <Head title={t('dashboard.title')} />

            {/*
             * Konten dashboard sebelumnya dinonaktifkan sementara selama pengembangan.
             * Simpan sebagai referensi dan akan diaktifkan kembali setelah siap.
             */}
            {/**
            <div className="grid gap-4 py-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Hunian Terisi</div>
                    <div className="mt-2 text-3xl font-bold">78%</div>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Tagihan Aktif</div>
                    <div className="mt-2 text-3xl font-bold">24</div>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Pembayaran Terkini</div>
                    <div className="mt-2 text-3xl font-bold">Rp 4,2jt</div>
                </div>
            </div>

            <div className="grid gap-4 pb-10 md:grid-cols-2">
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold">Kamar Perlu Perhatian</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Kamar A-102 — lampu mati</li>
                        <li>• Kamar B-203 — komplain kebisingan</li>
                        <li>• Kamar C-310 — jadwal pembersihan</li>
                    </ul>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold">Agenda Hari Ini</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• 10:00 — Cek meteran listrik</li>
                        <li>• 13:30 — Meeting vendor laundry</li>
                        <li>• 16:00 — Follow up pembayaran</li>
                    </ul>
                </div>
            </div>
            */}

            <div className="py-8">
                <Card className="mx-auto max-w-2xl">
                    <CardHeader className="flex flex-row items-start gap-3">
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md">
                            <Wrench className="text-muted-foreground h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle>{t('dashboard.wip.title')}</CardTitle>
                            <CardDescription>
                                {t('dashboard.wip.desc')}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">
                            {t('dashboard.wip.hint')}
                        </p>
                        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                            <li>{t('dashboard.wip.room')}</li>
                            <li>{t('dashboard.wip.contract')}</li>
                            <li>{t('dashboard.wip.billing')}</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </AuthLayoutLayout>
    );
}
