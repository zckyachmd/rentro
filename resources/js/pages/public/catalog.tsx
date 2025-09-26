import { PublicLayout } from '@/layouts';

export default function CatalogPage() {
    return (
        <PublicLayout
            title="Katalog Kamar"
            description="Jelajahi pilihan kamar kami dan temukan yang cocok."
        >
            <div className="space-y-4">
                <p className="text-muted-foreground">
                    Daftar kamar akan tampil di sini.
                </p>
            </div>
        </PublicLayout>
    );
}
