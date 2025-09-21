import { Head } from '@inertiajs/react';
import { Wrench } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthLayoutLayout from '@/layouts/auth-layout';

export default function Dashboard() {
    return (
        <AuthLayoutLayout
            pageTitle="Dashboard"
            pageDescription="Ringkasan aktivitas harian, status hunian, dan metrik penting di kost Anda."
        >
            <Head title="Dashboard" />

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
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <Wrench className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle>Dashboard sedang dalam pengembangan</CardTitle>
                            <CardDescription>
                                Kami sedang merapikan ringkasan data, grafik, dan insight agar lebih informatif.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Sementara itu, Anda tetap bisa mengelola data melalui menu yang tersedia di navigasi.
                        </p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            <li>Manajemen Kamar</li>
                            <li>Penyewa & Kontrak</li>
                            <li>Tagihan & Pembayaran</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </AuthLayoutLayout>
    );
}
