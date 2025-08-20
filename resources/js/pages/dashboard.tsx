import AuthLayoutLayout from '@/layouts/auth-layout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthLayoutLayout
            pageTitle="Dashboard"
            pageDescription="Ringkasan aktivitas harian, status hunian, dan metrik penting di kost Anda."
        >
            <Head title="Dashboard" />

            <div className="grid gap-4 py-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">
                        Hunian Terisi
                    </div>
                    <div className="mt-2 text-3xl font-bold">78%</div>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">
                        Tagihan Aktif
                    </div>
                    <div className="mt-2 text-3xl font-bold">24</div>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">
                        Pembayaran Terkini
                    </div>
                    <div className="mt-2 text-3xl font-bold">Rp 4,2jt</div>
                </div>
            </div>

            <div className="grid gap-4 pb-10 md:grid-cols-2">
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold">
                        Kamar Perlu Perhatian
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Kamar A-102 — lampu mati</li>
                        <li>• Kamar B-203 — komplain kebisingan</li>
                        <li>• Kamar C-310 — jadwal pembersihan</li>
                    </ul>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold">
                        Agenda Hari Ini
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• 10:00 — Cek meteran listrik</li>
                        <li>• 13:30 — Meeting vendor laundry</li>
                        <li>• 16:00 — Follow up pembayaran</li>
                    </ul>
                </div>
            </div>
        </AuthLayoutLayout>
    );
}
