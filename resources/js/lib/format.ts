function pickLocale(locale?: string): string {
    if (locale) return locale;
    try {
        const docLang =
            (typeof document !== 'undefined' &&
                document.documentElement?.lang) ||
            '';
        if (docLang) return docLang;
    } catch {
        /* ignore */
    }
    try {
        if (typeof navigator !== 'undefined' && navigator.language)
            return navigator.language;
    } catch {
        /* ignore */
    }
    return 'en-US';
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
          }
        : { year: 'numeric', month: 'short', day: '2-digit' };
    return new Intl.DateTimeFormat(pickLocale(locale), opts).format(d);
}
