// Palette AI — Service Worker v8
// גרסה: v8 | Release Candidate v5.1 — timing fix for share/install replacement
const CACHE = 'palette-ai-v8';
const ASSETS = [
  '/palette-ai/',
  '/palette-ai/index.html',
  '/palette-ai/manifest.json',
];
self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(cache) { return cache.addAll(ASSETS); }));
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;
  const isHTML = e.request.mode === 'navigate' || e.request.url.endsWith('/') || e.request.url.endsWith('/index.html') || e.request.url.endsWith('.html');
  if (isHTML) {
    e.respondWith(fetch(e.request).then(function(response) {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      }
      return response;
    }).catch(function() { return caches.match(e.request).then(function(cached) { return cached || caches.match('/palette-ai/index.html'); }); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(cached) {
    if (cached) return cached;
    return fetch(e.request).then(function(response) {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      }
      return response;
    }).catch(function() { if (e.request.mode === 'navigate') return caches.match('/palette-ai/index.html'); });
  }));
});
