import { ensureXsrfToken } from '@/hooks/use-confirm-password';

export type JsonRequestInit = Omit<
    RequestInit,
    'headers' | 'body' | 'method'
> & {
    headers?: HeadersInit;
    signal?: AbortSignal;
};

export type JsonPostInit = JsonRequestInit & {
    xsrf?: boolean;
};

export function createAbort(): AbortController {
    return new AbortController();
}

function mergeHeaders(base?: HeadersInit, extra?: HeadersInit): HeadersInit {
    const h = new Headers(base || {});
    const e = new Headers(extra || {});
    e.forEach((v, k) => h.set(k, v));
    return h;
}

async function toJson<T>(res: Response): Promise<T> {
    const ct = res.headers.get('Content-Type') || '';
    if (ct.includes('application/json')) return (await res.json()) as T;
    // Fallback empty as any
    return undefined as unknown as T;
}

export async function getJson<T = unknown>(
    url: string,
    init: JsonRequestInit = {},
): Promise<T> {
    const headers = mergeHeaders(init.headers, { Accept: 'application/json' });
    const res = await fetch(url, {
        ...init,
        method: 'GET',
        headers,
        credentials: init.credentials ?? 'same-origin',
    });
    if (!res.ok) {
        let msg = res.statusText || 'Request failed';
        try {
            const data = (await res.json()) as { message?: unknown };
            if (typeof data?.message === 'string') msg = data.message;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }
    return toJson<T>(res);
}

export async function head(
    url: string,
    init: JsonRequestInit = {},
): Promise<Response> {
    const headers = mergeHeaders(init.headers, { Accept: 'application/json' });
    const res = await fetch(url, {
        ...init,
        method: 'HEAD',
        headers,
        credentials: init.credentials ?? 'same-origin',
    });
    return res;
}

export async function postJson<T = unknown>(
    url: string,
    payload: Record<string, unknown>,
    init: JsonPostInit = {},
): Promise<T> {
    let headers: HeadersInit = mergeHeaders(init.headers, {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    });
    if (init.xsrf !== false) {
        const token = await ensureXsrfToken();
        if (token) headers = mergeHeaders(headers, { 'X-XSRF-TOKEN': token });
    }
    const res = await fetch(url, {
        ...init,
        method: 'POST',
        headers,
        body: JSON.stringify(payload ?? {}),
        credentials: init.credentials ?? 'same-origin',
    });
    if (!res.ok) {
        let msg = res.statusText || 'Request failed';
        try {
            const data = (await res.json()) as { message?: unknown };
            if (typeof data?.message === 'string') msg = data.message;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }
    return toJson<T>(res);
}

export async function postForm<T = unknown>(
    url: string,
    form: FormData,
    init: JsonPostInit = {},
): Promise<T> {
    let headers: HeadersInit = mergeHeaders(init.headers, {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    });
    if (init.xsrf !== false) {
        const token = await ensureXsrfToken();
        if (token) headers = mergeHeaders(headers, { 'X-XSRF-TOKEN': token });
    }
    const res = await fetch(url, {
        ...init,
        method: 'POST',
        headers,
        body: form,
        credentials: init.credentials ?? 'same-origin',
    });
    if (!res.ok) {
        let msg = res.statusText || 'Request failed';
        try {
            const data = (await res.json()) as { message?: unknown };
            if (typeof data?.message === 'string') msg = data.message;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }
    return toJson<T>(res);
}
