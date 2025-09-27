import { PublicLayout } from '@/layouts';

export default function TermsPage() {
    return (
        <PublicLayout
            title="Syarat & Ketentuan"
            description="Ketentuan penggunaan layanan Rentro."
        >
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>Konten syarat dan ketentuan akan ditempatkan di sini.</p>
            </div>
        </PublicLayout>
    );
}
