import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

export default function NotesPanel({
    value,
    onChange,
    error,
}: {
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    const { t } = useTranslation('management/contract');
    return (
        <div className="space-y-2 md:col-span-2">
            <Label>{t('create.notes.title')}</Label>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('create.notes.placeholder')}
                className="min-h-[96px]"
            />
            <InputError message={error} />
        </div>
    );
}
