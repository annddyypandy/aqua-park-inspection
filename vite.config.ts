import { createHash } from 'node:crypto';
import { copyFileSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const REPO_PAGES_BASE = '/aqua-park-inspection/';

function withBase(base: string, assetPath: string): string {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  if (assetPath === '/') {
    return prefix ? `${prefix}/` : '/';
  }

  const suffix = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return prefix ? `${prefix}${suffix}` : suffix;
}

function createPwaPlugin(base: string) {
  return VitePWA({
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
      start_url: base,
      scope: base,
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
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      navigateFallback: withBase(base, 'index.html'),
      cleanupOutdatedCaches: true,
      skipWaiting: false,
      clientsClaim: false,
    },
  });
}

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
function appShellServiceWorker(base: string): Plugin {
  return {
    name: 'app-shell-service-worker',
    apply: 'build',
    closeBundle: {
      sequential: true,
      order: 'post',
      handler() {
        const dist = path.resolve('dist');
        const urls = listDistFiles(dist).filter((relative) => {
          if (relative === 'sw.js' || relative === '404.html' || relative.startsWith('workbox-')) {
            return false;
          }

          return /\.(js|css|html|ico|png|svg|webmanifest)$/.test(relative);
        });

        const revision = createHash('sha256')
          .update(urls.map((url) => `${url}:${readFileSync(path.join(dist, url)).length}`).join('|'))
          .digest('hex')
          .slice(0, 12);

        const precache = urls.map((url) => withBase(base, url));
        const indexUrl = withBase(base, 'index.html');
        const rootUrl = withBase(base, '/');
        if (!precache.includes(indexUrl)) {
          precache.unshift(indexUrl);
        }
        if (!precache.includes(rootUrl)) {
          precache.unshift(rootUrl);
        }

        const source = `const CACHE_NAME = 'aqua-park-shell-${revision}';
const PRECACHE_URLS = ${JSON.stringify(precache, null, 2)};
const INDEX_URL = ${JSON.stringify(indexUrl)};

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
        .then((response) => response)
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match(INDEX_URL);
          }

          return cached;
        });
    }),
  );
});
`;

        writeFileSync(path.join(dist, 'sw.js'), source);
        copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
      },
    },
  };
}

const isVitest = Boolean(process.env.VITEST);
const base = process.env.GITHUB_PAGES === 'true' ? REPO_PAGES_BASE : '/';

export default defineConfig({
  base,
  plugins: [react(), ...(isVitest ? [] : [createPwaPlugin(base), appShellServiceWorker(base)])],
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  preview: {
    allowedHosts: ['.trycloudflare.com'],
  },
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
