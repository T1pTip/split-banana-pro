// Palette AI - Service Worker v13
// גרסה: v13 | Release v11.5 - semantic prompt upgrade + UI layout + launch_handler
const CACHE = 'palette-ai-v13';
const ASSETS = [
  '/palette-ai/',
  '/palette-ai/index.html',
  '/palette-ai/manifest.json',
  '/palette-ai/icon-192.png',
  '/palette-ai/icon-512.png'
];
self.addEventListener('install', function(e) { e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })); self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(caches.keys().then(function(keys) { return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })); })); self.clients.claim(); });
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;
  // v13: network-first also for manifest.json (so launch_handler updates immediately)
  const isHTML = e.request.mode === 'navigate' || e.request.url.endsWith('/') || e.request.url.endsWith('/index.html') || e.request.url.endsWith('.html');
  const isManifest = e.request.url.endsWith('/manifest.json');
  if (isHTML || isManifest) {
    e.respondWith(fetch(e.request).then(function(r) { if (r && r.status === 200 && r.type === 'basic') { const clone = r.clone(); caches.open(CACHE).then(function(c) { c.put(e.request, clone); }); } return r; }).catch(function() { return caches.match(e.request).then(function(cached) { return cached || caches.match('/palette-ai/index.html'); }); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(cached) { if (cached) return cached; return fetch(e.request).then(function(r) { if (r && r.status === 200 && r.type === 'basic') { const clone = r.clone(); caches.open(CACHE).then(function(c) { c.put(e.request, clone); }); } return r; }).catch(function() { if (e.request.mode === 'navigate') return caches.match('/palette-ai/index.html'); }); }));
});
