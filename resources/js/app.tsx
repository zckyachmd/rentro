import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import i18n, { preloadLocaleNamespaces } from '@/lib/i18n';
import '../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const render = () => {
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (i18n.options as any).supportedLngs = cfg.supported;
            }
            const rawLocale =
                p?.initialPage?.props?.preferences?.locale ??
                p?.page?.props?.preferences?.locale ??
                'en';

            const toBase = (l?: string | null) =>
                (l ?? 'en').toLowerCase().split('-')[0];
            const locale = toBase(rawLocale);

            const ensure = async () => {
                try {
                    if (i18n.language !== locale) {
                        await i18n.changeLanguage(locale);
                    }
                    await preloadLocaleNamespaces(locale);
                    try {
                        document.documentElement.lang = locale;
                    } catch {
                        void 0;
                    }
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
