// Replaced by scripts/prepare-sw.mjs after the production build.
const CACHE_NAME = 'masroofi-shell-__BUILD_HASH__';
const PRECACHE_PATHS = /* PRECACHE_PATHS */ [];
const APP_SCOPE = new URL(self.registration.scope);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(
    ['./', ...PRECACHE_PATHS].map((path) => new Request(new URL(path, APP_SCOPE).href, { cache: 'reload' })),
  )));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('masroofi-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== APP_SCOPE.origin || !url.pathname.startsWith(APP_SCOPE.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Keep each shell and its fingerprinted assets on the same release.
    const cached = await cache.match(request.mode === 'navigate' ? APP_SCOPE.href : request);
    if (cached) return cached;
    return fetch(request);
  })());
});
