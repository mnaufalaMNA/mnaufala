// ============================================================================
// Service Worker Auto-Update System
// Portal: https://mnaufalamna.github.io/mnaufala/
// ============================================================================

const CACHE_VERSION = 'mnaufala-v' + Date.now();
const STATIC_ASSETS = [
  './',
  './index.html',
  './404.html',
  './manifest.json',
  './robots.txt',
  './sitemap.xml'
];

// 1. Install & langsung paksa aktif tanpa menunggu tab ditutup
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// 2. Activate & langsung hapus semua cache versi lama seketika
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Network First Strategy: Ambil data terbaru dari internet dulu, jika offline baru ambil cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// 4. Menerima sinyal paksa update dari halaman web
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
