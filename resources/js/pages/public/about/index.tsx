import { PublicLayout } from '@/layouts';

export default function AboutPage() {
    return (
        <PublicLayout
            title="Tentang Rentro"
            description="Platform manajemen penyewaan kamar dan properti yang modern."
        >
            <div className="space-y-4">
                <p className="text-muted-foreground">
                    Informasi tentang Rentro akan tampil di sini.
                </p>
            </div>
        </PublicLayout>
    );
}
