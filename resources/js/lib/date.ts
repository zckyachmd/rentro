export function toISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function todayISO(): string {
    return toISO(startOfDay(new Date()));
}

export function yesterdayISO(): string {
    const t = startOfDay(new Date());
    t.setDate(t.getDate() - 1);
    return toISO(t);
}

export function tomorrowISO(): string {
    const t = startOfDay(new Date());
    t.setDate(t.getDate() + 1);
    return toISO(t);
}

export function toLocalDateTimeMinutes(d: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours(),
    )}:${pad(d.getMinutes())}`;
}
