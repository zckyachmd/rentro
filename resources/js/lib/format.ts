import i18n from '@/lib/i18n';

function canonicalizeLocale(l: string): string {
    const parts = String(l).split('-');
    if (parts.length === 1) return parts[0].toLowerCase();
    const [lang, region, ...rest] = parts;
    return [lang.toLowerCase(), region.toUpperCase(), ...rest].join('-');
}

function mapBaseLocale(l: string): string {
    const base = l.toLowerCase();
    if (base === 'id') return 'id-ID';
    return canonicalizeLocale(l);
}

function pickLocale(locale?: string): string {
    if (locale) return mapBaseLocale(locale);
    try {
        // Prefer i18n active language (works on SSR and client)
        const active = (i18n && i18n.language) || '';
        if (active) return mapBaseLocale(active);
    } catch {
        /* ignore */
    }
    try {
        const docLang =
            (typeof document !== 'undefined' &&
                document.documentElement?.lang) ||
            '';
        if (docLang) return mapBaseLocale(docLang);
    } catch {
        /* ignore */
    }
    try {
        if (typeof navigator !== 'undefined' && navigator.language)
            return mapBaseLocale(navigator.language);
    } catch {
        /* ignore */
    }
    return 'id-ID';
}

export function formatIDR(
    val?: number | string | null,
    locale?: string,
): string {
    if (val == null || val === '') return 'Rp -';
    const n = typeof val === 'string' ? Number(val) : val;
    if (Number.isNaN(n)) return 'Rp -';
    try {
        return new Intl.NumberFormat(pickLocale(locale), {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(n);
    } catch {
        const loc = pickLocale(locale);
        return `Rp ${n.toLocaleString(loc)}`;
    }
}

export function formatDate(
    input?: string | Date | null,
    withTime: boolean = false,
    locale?: string,
): string {
    if (!input) return '-';
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '-';
    const opts: Intl.DateTimeFormatOptions = withTime
        ? {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jakarta',
          }
        : {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              timeZone: 'Asia/Jakarta',
          };
    return new Intl.DateTimeFormat(pickLocale(locale), opts).format(d);
}

export function formatTimeAgo(
    input?: string | Date | null,
    locale?: string,
): string {
    if (!input) return '';
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    const now = Date.now();
    const diffSec = Math.round((d.getTime() - now) / 1000); // negative for past
    const absSec = Math.abs(diffSec);

    const rtf = new Intl.RelativeTimeFormat(pickLocale(locale), {
        numeric: 'auto',
    });

    if (absSec < 60) return rtf.format(diffSec, 'second');
    const diffMin = Math.round(diffSec / 60);
    const absMin = Math.abs(diffMin);
    if (absMin < 60) return rtf.format(diffMin, 'minute');
    const diffHour = Math.round(diffSec / 3600);
    const absHour = Math.abs(diffHour);
    if (absHour < 24) return rtf.format(diffHour, 'hour');
    const diffDay = Math.round(diffSec / 86400);
    const absDay = Math.abs(diffDay);
    if (absDay < 7) return rtf.format(diffDay, 'day');
    // For older than a week, show absolute date with time
    return formatDate(d, true, locale);
}
