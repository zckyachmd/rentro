import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import i18n, { preloadLocaleNamespaces } from '@/lib/i18n';
import { prefetchIcons } from '@/lib/lucide';
import { configureEcho } from '@laravel/echo-react';
import '../css/app.css';

// Make Echo config explicit to avoid env mismatch during dev
(() => {
    const env = ((import.meta as any)?.env || {}) as Record<string, unknown>;
    const dequote = (v: unknown) =>
        typeof v === 'string' ? v.replace(/^['"]|['"]$/g, '') : (v as any);
    const key = dequote(env.VITE_REVERB_APP_KEY) as string | undefined;
    const host =
        (dequote(env.VITE_REVERB_HOST) as string | undefined) ||
        (typeof window !== 'undefined' ? window.location.hostname : undefined);
    const portStr = dequote(env.VITE_REVERB_PORT) as string | undefined;
    const port =
        portStr && !Number.isNaN(Number(portStr)) ? Number(portStr) : 8080;
    const scheme =
        (dequote(env.VITE_REVERB_SCHEME) as string | undefined) || 'https';
    const wsPath = dequote(env.VITE_REVERB_WS_PATH) as string | undefined;
    // Extract CSRF token for private channel auth
    let csrf: string | undefined;
    try {
        csrf =
            (typeof document !== 'undefined'
                ? document
                      .querySelector('meta[name="csrf-token"]')
                      ?.getAttribute('content')
                : undefined) || undefined;
    } catch {
        /* ignore */
    }

    configureEcho({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        wsPath: wsPath || undefined,
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: csrf ? { 'X-CSRF-TOKEN': csrf } : {},
        },
    });
})();

// Optional: small debug hook to know Echo is ready
try {
    const Echo: any = (globalThis as any).Echo;
    if (Echo?.connector?.pusher?.connection) {
        Echo.connector.pusher.connection.bind('connected', () => {
            try {
                const opts = Echo?.connector?.pusher?.config || {};
                console.info('[Echo] Connected to Reverb', {
                    host: opts.wsHost,
                    port: opts.wsPort,
                    forceTLS: opts.forceTLS,
                    path: opts.wsPath,
                });
            } catch {
                console.info('[Echo] Connected to Reverb');
            }
        });
        Echo.connector.pusher.connection.bind('error', (e: any) => {
            console.warn('[Echo] Connection error', e);
        });
    }
} catch {
    /* ignore */
}

const appName =
    import.meta.env?.VITE_APP_NAME ??
    (typeof document !== 'undefined'
        ? (document
              .querySelector('meta[name="application-name"]')
              ?.getAttribute('content') ??
          document
              .querySelector('meta[property="og:site_name"]')
              ?.getAttribute('content'))
        : undefined) ??
    'Laravel';

createInertiaApp({
    title: (title) =>
        title && title.trim().length > 0 ? `${title} - ${appName}` : appName,
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.{tsx,ts,jsx,js}'),
        ),
    setup({ el, App, props }) {
        let render = () => {
            if (el.hasChildNodes()) {
                hydrateRoot(
                    el,
                    <React.Suspense fallback={null}>
                        <App {...props} />
                    </React.Suspense>,
                );
            } else {
                createRoot(el).render(
                    <React.Suspense fallback={null}>
                        <App {...props} />
                    </React.Suspense>,
                );
            }
        };

        // ---- Realtime notifications bridge ----
        function RealtimeNotificationsBridge({ userId }: { userId?: number }) {
            React.useEffect(() => {
                if (!userId) return;
                const Echo: any = (globalThis as any).Echo;
                if (!Echo) return;

                const channel = Echo.private(
                    `App.Models.User.${userId}`,
                ).notification((payload: any) => {
                    try {
                        // 1) Fire a global event for UI components to react to
                        const detail = {
                            id: payload?.id ?? crypto.randomUUID(),
                            title: payload?.title ?? 'Notification',
                            message: payload?.message ?? '',
                            url: payload?.url ?? null,
                            created_at: new Date().toISOString(),
                        };
                        window.dispatchEvent(
                            new CustomEvent('notifications:incoming', {
                                detail,
                            }),
                        );
                        // 2) Increment a lightweight global unread counter
                        window.dispatchEvent(
                            new CustomEvent('notifications:inc-unread', {
                                detail: { by: 1 },
                            }),
                        );
                    } catch {
                        /* ignore */
                    }
                });

                return () => {
                    try {
                        channel?.unsubscribe?.();
                    } catch {}
                };
            }, [userId]);

            return null;
        }

        try {
            type PrefProps = {
                initialPage?: {
                    props?: {
                        preferences?: { locale?: string | null };
                        i18n?: { supported?: string[]; fallback?: string };
                    };
                };
                page?: {
                    props?: {
                        preferences?: { locale?: string | null };
                        i18n?: { supported?: string[]; fallback?: string };
                    };
                };
            };
            const p = props as PrefProps;
            const cfg =
                p?.initialPage?.props?.i18n ??
                p?.page?.props?.i18n ??
                undefined;
            if (cfg?.supported && Array.isArray(cfg.supported)) {
                (
                    i18n.options as unknown as { supportedLngs?: string[] }
                ).supportedLngs = cfg.supported;
            }
            const rawLocale =
                p?.initialPage?.props?.preferences?.locale ??
                p?.page?.props?.preferences?.locale ??
                'id';

            const toBase = (l?: string | null) =>
                (l ?? 'id').toLowerCase().split('-')[0];
            const locale = toBase(rawLocale);

            const ensure = async () => {
                try {
                    if (i18n.language !== locale) {
                        await i18n.changeLanguage(locale);
                    }
                    await preloadLocaleNamespaces(locale);
                    // Preload icons likely needed on the initial view to avoid lazy flicker
                    try {
                        type MenuLike = {
                            icon?: string;
                            children?: MenuLike[];
                        };
                        type RootProps = {
                            menus?: Array<{ items?: Array<MenuLike> }>;
                            publicMenus?: MenuLike[];
                        };
                        const rootProps: RootProps = (p?.initialPage?.props ??
                            p?.page?.props ??
                            {}) as RootProps;
                        const collect = new Set<string>();
                        // App menus
                        const menus = rootProps?.menus as
                            | Array<{
                                  items?: Array<{
                                      icon?: string;
                                      children?: Array<{ icon?: string }>;
                                  }>;
                              }>
                            | undefined;
                        if (Array.isArray(menus)) {
                            for (const g of menus) {
                                for (const it of g.items ?? []) {
                                    if (it?.icon) collect.add(String(it.icon));
                                    for (const ch of it.children ?? []) {
                                        if (ch?.icon)
                                            collect.add(String(ch.icon));
                                    }
                                }
                            }
                        }
                        // Public menus
                        const publicMenus = rootProps?.publicMenus;
                        if (Array.isArray(publicMenus)) {
                            const walk = (arr: MenuLike[]) => {
                                for (const it of arr) {
                                    if (it?.icon) collect.add(String(it.icon));
                                    if (Array.isArray(it?.children))
                                        walk(it.children);
                                }
                            };
                            walk(publicMenus);
                        }
                        if (collect.size > 0) {
                            await prefetchIcons(Array.from(collect));
                        }
                    } catch {
                        // ignore icon preload failures
                    }
                    try {
                        document.documentElement.lang = locale;
                    } catch {
                        void 0;
                    }

                    // Try to infer authenticated user id from Inertia shared props
                    let userId: number | undefined;
                    try {
                        const anyProps: any = (p?.initialPage?.props ??
                            p?.page?.props ??
                            {}) as any;
                        userId =
                            anyProps?.auth?.user?.id ??
                            anyProps?.user?.id ??
                            undefined;
                    } catch {
                        /* ignore */
                    }

                    // Patch the render function to include realtime bridge with userId
                    render = () => {
                        if (el.hasChildNodes()) {
                            hydrateRoot(
                                el,
                                <React.Suspense fallback={null}>
                                    <>
                                        <RealtimeNotificationsBridge
                                            userId={userId}
                                        />
                                        <App {...props} />
                                    </>
                                </React.Suspense>,
                            );
                        } else {
                            createRoot(el).render(
                                <React.Suspense fallback={null}>
                                    <>
                                        <RealtimeNotificationsBridge
                                            userId={userId}
                                        />
                                        <App {...props} />
                                    </>
                                </React.Suspense>,
                            );
                        }
                    };
                } catch {
                    void 0;
                }
            };
            void ensure().then(render).catch(render);
        } catch {
            render();
        }
    },
    progress: { color: '#4B5563' },
});
