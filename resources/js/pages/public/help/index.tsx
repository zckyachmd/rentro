import { PublicLayout } from '@/layouts';

export default function HelpPage() {
    return (
        <PublicLayout
            title="Bantuan"
            description="Temukan jawaban dan panduan penggunaan Rentro."
        >
            <div className="space-y-4">
                <section id="faq" className="space-y-2">
                    <h2 className="text-lg font-semibold">FAQ</h2>
                    <p className="text-muted-foreground">
                        Pertanyaan umum akan tampil di sini.
                    </p>
                </section>
            </div>
        </PublicLayout>
    );
}
