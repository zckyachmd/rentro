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
    errors?: Partial<Record<'rent_cents' | 'deposit_cents', string>>;
    billingPeriod?: 'Daily' | 'Weekly' | 'Monthly';
}) {
    const suffix =
        billingPeriod === 'Monthly'
            ? 'per bulan'
            : billingPeriod === 'Weekly'
              ? 'per minggu'
              : billingPeriod === 'Daily'
                ? 'per hari'
                : undefined;
    return (
        <div className="grid gap-6 md:col-span-2 md:grid-cols-2">
            <div className="space-y-2">
                <Label>
                    Biaya Sewa ({suffix}){' '}
                    <span className="text-destructive">*</span>
                </Label>
                <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="cth. 1.200.000"
                    value={rent}
                    onChange={(e) => onRent(e.target.value)}
                    className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                    Pratinjau: {formatIDR(rent)}
                </p>
                <InputError message={errors.rent_cents} />
            </div>

            <div className="space-y-2">
                <Label>Deposit</Label>
                <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="cth. 500.000 (opsional)"
                    value={deposit}
                    onChange={(e) => onDeposit(e.target.value)}
                    className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                    Pratinjau: {formatIDR(deposit)}
                </p>
                <InputError message={errors.deposit_cents} />
            </div>
        </div>
    );
}
