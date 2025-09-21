import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NotesPanel({
    value,
    onChange,
    error,
}: {
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-2 md:col-span-2">
            <Label>Catatan Kontrak</Label>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Opsional: tambahkan aturan khusus, kondisi kamar, kebijakan listrik/air, dsb."
                className="min-h-[96px]"
            />
            <InputError message={error} />
        </div>
    );
}
