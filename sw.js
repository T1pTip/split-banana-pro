// Palette AI — Service Worker
// גרסה: v10 | network-first HTML + auto-reload + full offline precache
const CACHE = 'palette-ai-v10';
const ASSETS = [
  '/palette-ai/',
  '/palette-ai/index.html',
  '/palette-ai/app.js',
  '/palette-ai/manifest.json',
  '/palette-ai/icon-192.png',
  '/palette-ai/icon-512.png',
];

// Install — precache all critical assets (now includes app.js + icons for full offline)
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Use addAll with fallback — if one asset fails, others still cache
      return Promise.all(
        ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW v8] Failed to cache:', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate — delete old caches + claim all clients + notify for auto-reload
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k)   { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'SW_UPDATED', cache: CACHE });
        });
      });
    })
  );
});

// Fetch — Smart strategy
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  
  // Tracker/analytics — always network, never cache
  if (e.request.url.includes('script.google.com')) return;
  
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' ||
                 e.request.destination === 'document' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/palette-ai/' ||
                 url.pathname === '/palette-ai';
  
  if (isHTML) {
    // Network-first for HTML — always try fresh, fallback to cache offline
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(function(response) {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('/palette-ai/index.html');
        });
      })
    );
  } else {
    // Cache-first for assets (icons, manifest, app.js) with background refresh
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        // Return cached immediately if exists
        if (cached) {
          // Background refresh — update cache silently
          fetch(e.request).then(function(response) {
            if (response && response.status === 200 && response.type === 'basic') {
              caches.open(CACHE).then(function(cache) {
                cache.put(e.request, response);
              });
            }
          }).catch(function() {});
          return cached;
        }
        // Not in cache — fetch from network and cache
        return fetch(e.request).then(function(response) {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
          }
          return response;
        });
      })
    );
  }
});

// v8 changelog:
// - Added app.js, icon-192.png, icon-512.png to ASSETS precache (fixes offline app.js bug)
// - Stale-while-revalidate for assets (instant load + background refresh)
// - Graceful install — cache.add per-asset with catch (prevents total install failure)
