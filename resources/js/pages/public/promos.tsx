import { PublicLayout } from '@/layouts';

export default function PromosPage() {
    return (
        <PublicLayout
            title="Promo"
            description="Dapatkan penawaran menarik untuk penyewaan kamar."
        >
            <div className="space-y-4">
                <p className="text-muted-foreground">
                    Daftar promo akan tampil di sini.
                </p>
            </div>
        </PublicLayout>
    );
}
