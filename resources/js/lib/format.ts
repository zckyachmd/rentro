export function formatIDR(
    val?: number | string | null,
    locale: string = 'id-ID',
): string {
    if (val == null || val === '') return 'Rp -';
    const n = typeof val === 'string' ? Number(val) : val;
    if (Number.isNaN(n)) return 'Rp -';
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(n);
    } catch {
        return `Rp ${n.toLocaleString(locale)}`;
    }
}

export function formatDate(
    input?: string | Date | null,
    withTime: boolean = false,
    locale: string = 'id-ID',
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
    return new Intl.DateTimeFormat(locale, opts).format(d);
}
