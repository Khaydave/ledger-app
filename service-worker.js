const CACHE_NAME = 'ledger-pwa-shell-v1';
const INDEX_URL = new URL('./index.html', self.location).href;
const SHELL_URLS = [
  INDEX_URL,
  new URL('./manifest.webmanifest', self.location).href,
  new URL('./assets/ledger-favicon.png', self.location).href,
  new URL('./assets/ledger-touch-icon.png', self.location).href,
  new URL('./assets/pwa-192.png', self.location).href,
  new URL('./assets/pwa-512.png', self.location).href
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('ledger-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const shell = await caches.match(INDEX_URL);
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
