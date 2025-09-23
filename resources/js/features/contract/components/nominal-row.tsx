import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { formatIDR } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function NominalRow({
    rent,
    deposit,
    onRent,
    onDeposit,
    errors = {},
    billingPeriod,
}: {
    rent: string;
    deposit: string;
    onRent: (v: string) => void;
    onDeposit: (v: string) => void;
    errors?: Partial<Record<'rent_cents' | 'deposit_cents', string>>;
    billingPeriod?: 'Daily' | 'Weekly' | 'Monthly';
}) {
    const { t } = useTranslation('management/contract');
    const suffix =
        billingPeriod === 'Monthly'
            ? t('create.form.suffix.monthly')
            : billingPeriod === 'Weekly'
              ? t('create.form.suffix.weekly')
              : billingPeriod === 'Daily'
                ? t('create.form.suffix.daily')
                : undefined;
    return (
        <div className="grid gap-6 md:col-span-2 md:grid-cols-2">
            <div className="space-y-2">
                <Label>
                    {t('create.form.fields.rent', { suffix })}{' '}
                    <span className="text-destructive">*</span>
                </Label>
                <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder={t('create.form.placeholders.rent')}
                    value={rent}
                    onChange={(e) => onRent(e.target.value)}
                    className="h-9"
                />
                <p className="text-muted-foreground text-xs">
                    {t('management.room.form.preview')} {formatIDR(rent)}
                </p>
                <InputError message={errors.rent_cents} />
            </div>

            <div className="space-y-2">
                <Label>{t('create.form.fields.deposit')}</Label>
                <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder={t('create.form.placeholders.deposit')}
                    value={deposit}
                    onChange={(e) => onDeposit(e.target.value)}
                    className="h-9"
                />
                <p className="text-muted-foreground text-xs">
                    {t('management.room.form.preview')} {formatIDR(deposit)}
                </p>
                <InputError message={errors.deposit_cents} />
            </div>
        </div>
    );
}
