// Palette AI — Service Worker
// גרסה: v6 | network-first for HTML (fresh content), cache-first for assets
const CACHE = 'palette-ai-v6';
const ASSETS = [
  '/palette-ai/',
  '/palette-ai/index.html',
  '/palette-ai/manifest.json',
];

// Install — precache assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — delete old caches + claim all clients
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
      // Force reload all open clients to get fresh HTML
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
  
  // Tracker requests — always network, never cache
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
    // Cache-first for assets (icons, manifest, etc)
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
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
// v6 — Force fresh HTML + auto-reload clients on update (Session 8 fix)
