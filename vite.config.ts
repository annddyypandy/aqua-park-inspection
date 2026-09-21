import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const pwaPlugin = VitePWA({
  registerType: 'prompt',
  injectRegister: 'auto',
  includeAssets: ['apple-touch-icon.png', 'favicon.ico'],
  devOptions: {
    enabled: false,
  },
  manifest: {
    name: 'Aqua Park Inspection',
    short_name: 'Aqua Inspect',
    description: 'Offline-first inspection app for inflatable aqua park equipment.',
    theme_color: '#0b3d4a',
    background_color: '#06262e',
    display: 'standalone',
    orientation: 'any',
    start_url: '/',
    scope: '/',
    lang: 'en',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    // Cache the application shell only. Inspection photos live in IndexedDB
    // and must not be managed by the service worker.
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
    navigateFallback: '/index.html',
    cleanupOutdatedCaches: true,
    skipWaiting: false,
    clientsClaim: false,
  },
});

function listDistFiles(root: string, current = root): string[] {
  const entries = readdirSync(current);
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(current, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      files.push(...listDistFiles(root, absolute));
      continue;
    }

    files.push(path.relative(root, absolute).split(path.sep).join('/'));
  }

  return files;
}

/**
 * workbox-build's globbing is unreliable on this Node 18 toolchain.
 * Rewrite sw.js with an explicit app-shell precache so offline startup works.
 */
function appShellServiceWorker(): Plugin {
  return {
    name: 'app-shell-service-worker',
    apply: 'build',
    closeBundle: {
      sequential: true,
      order: 'post',
      handler() {
        const dist = path.resolve('dist');
        const urls = listDistFiles(dist).filter((relative) => {
          if (relative === 'sw.js' || relative.startsWith('workbox-')) {
            return false;
          }

          return /\.(js|css|html|ico|png|svg|webmanifest)$/.test(relative);
        });

        const revision = createHash('sha256')
          .update(urls.map((url) => `${url}:${readFileSync(path.join(dist, url)).length}`).join('|'))
          .digest('hex')
          .slice(0, 12);

        const precache = urls.map((url) => `/${url}`);
        if (!precache.includes('/index.html')) {
          precache.unshift('/index.html');
        }
        if (!precache.includes('/')) {
          precache.unshift('/');
        }

        const source = `const CACHE_NAME = 'aqua-park-shell-${revision}';
const PRECACHE_URLS = ${JSON.stringify(precache, null, 2)};

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('aqua-park-shell-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          return cached;
        });
    }),
  );
});
`;

        writeFileSync(path.join(dist, 'sw.js'), source);
      },
    },
  };
}

const isVitest = Boolean(process.env.VITEST);

export default defineConfig({
  plugins: [react(), ...(isVitest ? [] : [pwaPlugin, appShellServiceWorker()])],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
