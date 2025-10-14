import { Page, PageProps } from '@inertiajs/core';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { renderToString } from 'react-dom/server';

import { route as ziggyRoute } from 'ziggy-js';

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
            (globalThis as unknown as { route: typeof ziggyRoute }).route =
                ziggyRoute;
            return <App {...props} />;
        },
    });
