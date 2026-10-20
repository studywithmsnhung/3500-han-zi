// 3500 汉字 — service worker: cache app để dùng offline. ĐỔI CACHE_VERSION mỗi lần cập nhật index.html.
const CACHE_VERSION = 'v1.0-20261019';
const APP = 'app-' + CACHE_VERSION, FONTS = 'fonts-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {   // font Google: dùng bản cache, cập nhật ngầm
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (u.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || u.pathname.endsWith('/index.html')) {   // trang: mạng trước (lấy bản mới), mất mạng thì dùng cache
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(APP).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html', { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(h => h || fetch(e.request)));
});
