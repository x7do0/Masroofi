// Replaced by scripts/prepare-sw.mjs after the production build.
const CACHE_NAME = 'masroofi-shell-__BUILD_HASH__';
const PRECACHE_PATHS = /* PRECACHE_PATHS */ [];
const APP_SCOPE = new URL(self.registration.scope);
const PRECACHE_URLS = new Set(['./', ...PRECACHE_PATHS].map((path) => new URL(path, APP_SCOPE).href));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(
    [...PRECACHE_URLS].map((url) => new Request(url, { cache: 'reload' })),
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
    const key = request.mode === 'navigate' ? APP_SCOPE.href : request.url;
    // Only allowlisted, versioned public shell files are invariant across Origin
    // headers. A module request can otherwise miss a precache with Vary: Origin.
    // Keep strict matching for every non-shell URL; never ignore query strings.
    const cached = await cache.match(request.mode === 'navigate' ? key : request, {
      ignoreVary: PRECACHE_URLS.has(key),
    });
    if (cached) return cached;
    return fetch(request);
  })());
});
