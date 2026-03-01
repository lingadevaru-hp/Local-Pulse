
// public/sw.js
const CACHE_NAME = 'local-pulse-cache-v2'; // Incremented cache version
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add other important assets like global CSS, main JS chunks if known
  // Placeholder for Next.js static assets (actual paths are hashed)
  // '/_next/static/...', (these will be cached dynamically by Next.js PWA solutions or on first load)
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // Add an offline fallback page if you create one
  // '/offline.html' 
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' }))); // Force reload from network
      })
      .catch(error => {
        console.error('Service Worker: Cache addAll failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching ', event.request.url);

  // Cache-First strategy for app shell resources
  if (urlsToCache.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Network-first for navigation requests, then cache, then offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If response is good, clone it and put it in the cache.
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network request failed, try to get from cache
          return caches.match(event.request)
            .then(response => {
              return response || createOfflineFallback();
            });
        })
    );
    return;
  }

  // For other requests (assets, API calls), try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(response => {
          // If not in cache and it's an API request or specific asset, return a more specific error or generic offline for assets
          if (!response && (event.request.url.includes('/api/') || event.request.headers.get('accept')?.includes('image'))) {
             return createOfflineFallback(); // Or a more specific error for API
          }
          return response || createOfflineFallback();
        });
      })
  );
});

function createOfflineFallback() {
  return new Response(
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Local Pulse</title>
      <style>
        body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f3f4f6; color: #1f2937; text-align: center; }
        .container { padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #007AFF; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>You are offline</h1>
        <p>Please connect to the internet to view events and use Local Pulse.</p>
      </div>
    </body>
    </html>
    `,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
