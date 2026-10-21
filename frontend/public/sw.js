// ==============================================================================
// LUMI AI - SECURE PRODUCTION SERVICE WORKER
// ==============================================================================

const CACHE_NAME = 'lumi-ai-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

// Installation: Cache static app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Non-critical asset precache note:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation: Clean up stale legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Secure routing & cache management
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. STRICT SECURITY: Never cache API requests, SSE streams, or non-GET requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('stream') ||
    url.pathname.includes('auth') ||
    url.pathname.includes('documents')
  ) {
    // Pass directly to network with zero caching of private conversations or data
    return;
  }

  // 2. Navigation / App Shell: Stale-while-revalidate with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const indexFallback = await caches.match('/index.html');
          return indexFallback || Response.error();
        })
    );
    return;
  }

  // 3. Static Assets (CSS, JS, Fonts, Images): Cache-first with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
