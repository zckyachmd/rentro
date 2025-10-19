#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const fs = require('fs');
const http = require('http');
const path = require('path');

function exists(p) {
  try { fs.accessSync(p, fs.constants.R_OK); return true; } catch { return false; }
}

const args = process.argv.slice(2);
let port = 13714;
let timeout = 1000;
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--port' || args[i] === '-p') && args[i+1]) port = parseInt(args[++i], 10) || port;
  else if ((args[i] === '--timeout' || args[i] === '-t') && args[i+1]) timeout = parseInt(args[++i], 10) || timeout;
}

// 1) Ensure SSR file exists (use APP_ROOT if provided)
const baseDir = process.env.APP_ROOT || process.cwd();
const candidates = [
  path.join(baseDir, 'bootstrap/ssr/ssr.mjs'),
  path.join(baseDir, 'bootstrap/ssr/ssr.js'),
  path.join(baseDir, 'bootstrap/ssr/ssr.cjs'),
];
if (!candidates.some(exists)) {
  process.stderr.write('[ssr-health] SSR bundle not found\n');
  process.exit(1);
}

// 2) Try a quick HTTP health probe if a server is listening (strict)
const req = http.request({ host: '127.0.0.1', port, path: '/health', method: 'GET', timeout }, (res) => {
  if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
    process.stdout.write('[ssr-health] OK\n');
    process.exit(0);
  }
  process.stderr.write(`[ssr-health] Unexpected status: ${res.statusCode}\n`);
  process.exit(1);
});
req.on('timeout', () => { req.destroy(new Error('timeout')); });
req.on('error', () => {
  process.stderr.write('[ssr-health] HTTP probe failed\n');
  process.exit(1);
});
req.end();
