import InputError from '@/components/ui/input-error';
import SearchSelect, { type SearchOption } from '@/components/ui/search-select';

export type ResolvedInvoice = {
    id: string;
    number: string;
    amount: number;
    status: string;
    tenant_name?: string | null;
    outstanding?: number;
    eligible?: boolean;
} | null;

export default function InvoiceLookup({
    options,
    value,
    onChange,
    errorMessage,
    lookupError,
    resolved,
    currency,
}: {
    options: SearchOption[];
    value: string | '';
    onChange: (v: string, opt?: SearchOption) => void;
    errorMessage?: string;
    lookupError?: string | null;
    resolved: ResolvedInvoice;
    currency: (n: number) => string;
}) {
    return (
        <div className="space-y-1">
            <SearchSelect
                options={options}
                value={value || undefined}
                onChange={(v, opt) => onChange(v || '', opt)}
                placeholder="Cari invoice…"
                emptyText={
                    options.length
                        ? 'Tidak ada hasil'
                        : 'Belum ada kandidat invoice'
                }
            />
            <InputError message={errorMessage} />
            {lookupError ? (
                <InputError className="mt-0.5" message={lookupError} />
            ) : null}
            {resolved ? (
                <div
                    className={
                        'rounded-md border bg-muted/30 p-2 text-[12px] ' +
                        (errorMessage ? 'mt-1' : 'mt-0')
                    }
                >
                    <div className="text-muted-foreground">
                        Nilai: {currency(resolved.amount)} · Sisa:{' '}
                        {currency(resolved.outstanding ?? 0)}
                        {resolved.tenant_name
                            ? ` · Penyewa: ${resolved.tenant_name}`
                            : ''}
                    </div>
                    {!resolved.eligible ? (
                        <InputError
                            className="mt-0.5"
                            message={
                                'Invoice tidak dapat dibayar (sudah lunas atau status tidak valid)'
                            }
                        />
                    ) : null}
                </div>
            ) : (
                <div
                    className={
                        (errorMessage ? 'mt-0.5 ' : 'mt-0 ') +
                        'text-xs text-muted-foreground'
                    }
                >
                    Pilih invoice terlebih dahulu untuk melanjutkan.
                </div>
            )}
        </div>
    );
}
