// ============================================================================
// Service Worker Auto-Update & Offline PWA System
// Portal: https://mnaufalamna.github.io/mnaufala/
// ============================================================================

const CACHE_VERSION = 'mnaufala-v' + Date.now();
const STATIC_ASSETS = [
  './',
  './index.html',
  './404.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './screenshot-desktop.svg',
  './screenshot-mobile.svg',
  './robots.txt',
  './sitemap.xml'
];

// 1. Install & langsung aktifkan precache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching assets:', err);
      });
    })
  );
});

// 2. Activate & hapus cache versi lama seketika
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

// 3. Network First Strategy dengan Fallback ke Offline Cache
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
            return caches.match('./index.html') || caches.match('/index.html');
          }
        });
      })
  );
});

// 4. Menerima sinyal paksa update
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
