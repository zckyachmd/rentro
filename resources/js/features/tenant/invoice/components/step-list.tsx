import Section from '@/features/tenant/invoice/components/section';

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {n}
            </div>
            <div>
                <div className="text-[13px] font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
        </div>
    );
}

export default function StepList({ isManualFlow }: { isManualFlow: boolean }) {
    return (
        <Section title="Cara Bayar" subtitle="Petunjuk singkat">
            {isManualFlow ? (
                <div className="space-y-2">
                    <Step
                        n={1}
                        title="Pilih rekening tujuan"
                        desc="Pilih salah satu rekening admin yang tersedia."
                    />
                    <Step
                        n={2}
                        title="Transfer sesuai instruksi"
                        desc="Transfer ke rekening terpilih; sertakan nomor invoice pada berita/notes bila diminta."
                    />
                    <Step
                        n={3}
                        title="Unggah bukti transfer"
                        desc="Unggah bukti pada form lalu kirim."
                    />
                    <Step
                        n={4}
                        title="Menunggu review admin"
                        desc="Admin akan memverifikasi pembayaran; status akan diperbarui."
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    <Step
                        n={1}
                        title="Buat VA"
                        desc="Pilih bank VA lalu buat nomor VA."
                    />
                    <Step
                        n={2}
                        title="Lakukan pembayaran"
                        desc="Bayar ke nomor VA sebelum batas waktu."
                    />
                    <Step
                        n={3}
                        title="Konfirmasi otomatis"
                        desc="Sistem akan mengecek status secara berkala."
                    />
                </div>
            )}
        </Section>
    );
}
