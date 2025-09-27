import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { formatIDR } from '@/lib/format';

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
    errors?: Partial<Record<'rent_idr' | 'deposit_idr', string>>;
    billingPeriod?: 'daily' | 'weekly' | 'monthly';
}) {
    const { t } = useTranslation('management/contract');
    const suffix =
        billingPeriod === 'monthly'
            ? t('create.form.suffix.monthly')
            : billingPeriod === 'weekly'
              ? t('create.form.suffix.weekly')
              : billingPeriod === 'daily'
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
                    {t('form.preview', { ns: 'management/room' })}{' '}
                    {formatIDR(rent)}
                </p>
                <InputError message={errors.rent_idr} />
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
                    {t('form.preview', { ns: 'management/room' })}{' '}
                    {formatIDR(deposit)}
                </p>
                <InputError message={errors.deposit_idr} />
            </div>
        </div>
    );
}
