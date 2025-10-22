'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export type QuickRangeOption =
    | '7d'
    | '30d'
    | '90d'
    | 'mtd'
    | 'wtd'
    | 'qtd'
    | 'ytd';

export type QuickRangeCustom = {
    key: string;
    label: React.ReactNode;
    getRange: () => { start: string; end: string };
    disabled?: boolean;
};

export type QuickRangeProps = {
    onSelect: (start: string, end: string) => void;
    options?: QuickRangeOption[];
    className?: string;
    disabled?: boolean;
    disabledOptions?: QuickRangeOption[];
    custom?: QuickRangeCustom[];
    showReset?: boolean;
    resetLabel?: React.ReactNode;
    onReset?: () => void;
    resetDisabled?: boolean;
};

function toIso(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function QuickRange({
    onSelect,
    options,
    className,
    disabled,
    disabledOptions,
    custom,
    showReset,
    resetLabel,
    onReset,
    resetDisabled,
}: QuickRangeProps) {
    const { t } = useTranslation();
    const opts: QuickRangeOption[] = React.useMemo(
        () => options ?? ['7d', '30d', '90d', 'mtd', 'wtd', 'qtd', 'ytd'],
        [options],
    );
    const isDisabled = (key: QuickRangeOption): boolean =>
        Boolean(disabled) || Boolean(disabledOptions?.includes(key));

    const handleDays = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        onSelect(toIso(start), toIso(end));
    };

    const handleMTD = () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth(), 1);
        onSelect(toIso(start), toIso(end));
    };
    const handleWTD = () => {
        const end = new Date();
        const dow = end.getDay();
        const mondayOffset = (dow + 6) % 7; // Monday = 0
        const start = new Date(end);
        start.setDate(end.getDate() - mondayOffset);
        onSelect(toIso(start), toIso(end));
    };
    const handleQTD = () => {
        const end = new Date();
        const qStartMonth = Math.floor(end.getMonth() / 3) * 3;
        const start = new Date(end.getFullYear(), qStartMonth, 1);
        onSelect(toIso(start), toIso(end));
    };
    const handleYTD = () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), 0, 1);
        onSelect(toIso(start), toIso(end));
    };

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
            <span className="text-muted-foreground text-xs">
                {t('dashboard.filters.quick')}:
            </span>
            {opts.includes('7d') && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleDays(7)}
                    disabled={isDisabled('7d')}
                >
                    7D
                </Button>
            )}
            {opts.includes('30d') && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleDays(30)}
                    disabled={isDisabled('30d')}
                >
                    30D
                </Button>
            )}
            {opts.includes('90d') && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleDays(90)}
                    disabled={isDisabled('90d')}
                >
                    90D
                </Button>
            )}
            {opts.includes('mtd') && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleMTD}
                    disabled={isDisabled('mtd')}
                >
                    {t('dashboard.filters.mtd')}
                </Button>
            )}
            {opts.includes('wtd') && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleWTD}
                    disabled={isDisabled('wtd')}
                >
                    {t('dashboard.filters.wtd')}
                </Button>
            )}
            {opts.includes('qtd') && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleQTD}
                    disabled={isDisabled('qtd')}
                >
                    {t('dashboard.filters.qtd')}
                </Button>
            )}
            {opts.includes('ytd') && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleYTD}
                    disabled={isDisabled('ytd')}
                >
                    {t('dashboard.filters.ytd')}
                </Button>
            )}
            {(custom || []).map((c) => (
                <Button
                    key={c.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                        try {
                            const r = c.getRange();
                            if (r && r.start && r.end) onSelect(r.start, r.end);
                        } catch {
                            /* ignore */
                        }
                    }}
                    disabled={Boolean(disabled) || Boolean(c.disabled)}
                >
                    {c.label}
                </Button>
            ))}
            {showReset && typeof onReset === 'function' && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-7 px-2 text-xs"
                    onClick={() => onReset()}
                    disabled={Boolean(disabled) || Boolean(resetDisabled)}
                >
                    {resetLabel ?? t('common.reset')}
                </Button>
            )}
        </div>
    );
}

export default QuickRange;
