import { Page, PageProps } from '@inertiajs/core';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { renderToString } from 'react-dom/server';

import route from 'ziggy-js';

export default (page: Page<PageProps>) =>
    createInertiaApp({
        page,
        render: renderToString,
        resolve: (name: string) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => {
            const ziggyAny: any = route as any;
            (globalThis as unknown as { route: typeof route }).route =
                ziggyAny?.route ?? ziggyAny;

            try {
                // Prefer the Ziggy config sent via Inertia props
                const p: any = props ?? {};
                const pageProps: any = p?.initialPage?.props ?? p?.page?.props ?? {};
                const ziggyConfig = pageProps?.ziggy;
                if (ziggyConfig) {
                    (globalThis as any).Ziggy = ziggyConfig;
                }
            } catch {
                // ignore
            }

            return <App {...props} />;
        },
    });
