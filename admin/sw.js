const CACHE_NAME = 'delrey-admin-v4';
const ASSETS = ['/logo-delrey.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only cache the logo; all other requests (HTML, API) go straight to network
  if (!e.request.url.endsWith('/logo-delrey.png')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
