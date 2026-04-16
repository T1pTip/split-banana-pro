// Palette AI — Service Worker v4
// גרסה: v4 | offline support מלא | cache bump Apr 16 2026
const CACHE = 'palette-ai-v4';
const ASSETS = [
  '/palette-ai/',
  '/palette-ai/index.html',
  '/palette-ai/manifest.json',
];

// Install — שמור assets בcache
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — מחק כל cache ישן
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k)   { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache first, network fallback
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  // Install tracker — תמיד network (לא cache)
  if (e.request.url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // cache רק responses תקינות מאותו origin
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // offline ואין cache — החזר index.html
        if (e.request.mode === 'navigate') {
          return caches.match('/palette-ai/index.html');
        }
      });
    })
  );
});
