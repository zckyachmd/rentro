import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    return (
        <div className="space-y-1">
            <SearchSelect
                options={options}
                value={value || undefined}
                onChange={(v, opt) => onChange(v || '', opt)}
                placeholder={t('payment.lookup.placeholder')}
                emptyText={
                    options.length
                        ? t('ui.select.no_results')
                        : t(
                              'payment.lookup.empty_candidates',
                              'No candidate invoices yet',
                          )
                }
            />
            <InputError message={errorMessage} />
            {lookupError ? (
                <InputError className="mt-0.5" message={lookupError} />
            ) : null}
            {resolved ? (
                <div
                    className={
                        'bg-muted/30 rounded-md border p-2 text-[12px] ' +
                        (errorMessage ? 'mt-1' : 'mt-0')
                    }
                >
                    <div className="text-muted-foreground">
                        {t('payment.lookup.summary', {
                            amount: currency(resolved.amount),
                            outstanding: currency(resolved.outstanding ?? 0),
                            tenant_optional: resolved.tenant_name
                                ? ` · ${t('common.tenant')}: ${resolved.tenant_name}`
                                : '',
                        })}
                    </div>
                    {!resolved.eligible ? (
                        <InputError
                            className="mt-0.5"
                            message={t('payment.lookup.ineligible')}
                        />
                    ) : null}
                </div>
            ) : (
                <div
                    className={
                        (errorMessage ? 'mt-0.5 ' : 'mt-0 ') +
                        'text-muted-foreground text-xs'
                    }
                >
                    {t('payment.lookup.pick_first')}
                </div>
            )}
        </div>
    );
}
