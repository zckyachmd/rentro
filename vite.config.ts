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

    // Public tunnel URL for dev over the internet (e.g., ngrok / cloudflared)
    // Prefer NGROK_URL, fallback to VITE_DEV_SERVER_URL used by laravel-vite-plugin
    const publicUrl = env.NGROK_URL || env.VITE_DEV_SERVER_URL || '';
    const tunnel = publicUrl ? new URL(publicUrl) : null;

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
            cors: true,
            watch: {
                usePolling: (process.env.CHOKIDAR_USEPOLLING || '').toLowerCase() === 'true',
                interval: Number(process.env.CHOKIDAR_INTERVAL || '300'),
                ignored: [
                    '**/node_modules/**',
                    '**/.git/**',
                    '**/vendor/**',
                    '**/storage/**',
                    '**/public/build/**',
                ],
            },
            hmr: disableHmr
                ? false
                : tunnel
                    ? {
                          host: tunnel.hostname,
                          protocol: 'wss',
                          clientPort: 443,
                      }
                    : {
                          host: '127.0.0.1',
                          port: 5173,
                          protocol: 'ws',
                          clientPort: 5173,
                      },
            origin: tunnel ? `${tunnel.protocol}//${tunnel.host}` : undefined,
        },
    };
});
