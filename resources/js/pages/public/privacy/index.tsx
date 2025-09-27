import { PublicLayout } from '@/layouts';

export default function PrivacyPage() {
    return (
        <PublicLayout
            title="Kebijakan Privasi"
            description="Bagaimana Rentro mengelola data dan privasi Anda."
        >
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>Konten kebijakan privasi akan ditempatkan di sini.</p>
            </div>
        </PublicLayout>
    );
}
