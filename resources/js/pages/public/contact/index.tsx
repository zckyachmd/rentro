import { PublicLayout } from '@/layouts';

export default function ContactPage() {
    return (
        <PublicLayout
            title="Kontak"
            description="Hubungi tim Rentro untuk pertanyaan dan bantuan."
        >
            <div className="space-y-4">
                <p className="text-muted-foreground">
                    Informasi kontak atau form akan tampil di sini.
                </p>
            </div>
        </PublicLayout>
    );
}
