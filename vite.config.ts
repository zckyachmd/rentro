import { resolve } from 'node:path';
import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const disableHmr =
        (env.VITE_DISABLE_HMR || '').toLowerCase() === 'true' ||
        env.VITE_DISABLE_HMR === '1';

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.tsx',
                refresh: true,
                hotFile: 'public/hot',
                buildDirectory: 'build',
            }),
            react(),
            tailwindcss(),
        ],
        esbuild: {
            jsx: 'automatic',
        },
        resolve: {
            alias: {
                'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
                '@': path.resolve(__dirname, 'resources/js'),
            },
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            hmr: disableHmr
                ? false
                : {
                      host: '127.0.0.1',
                      port: 5173,
                      protocol: 'ws',
                      clientPort: 5173,
                  },
        },
    };
});
