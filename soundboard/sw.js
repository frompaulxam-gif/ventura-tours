const cacheName = 'jarvis-soundboard-v1';
const files = ['index.html', 'app.js', 'clips.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(files.map(file => new Request(new URL(file, self.registration.scope), {redirect: 'error', cache: 'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('jarvis-soundboard-') && name !== cacheName) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const base = self.registration.scope;
  const shell = new URL('index.html', base);
  if (event.request.mode === 'navigate' && [new URL(base).pathname, shell.pathname].includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.open(cacheName).then(cache => cache.match(shell.href))));
  } else if (files.some(file => new URL(file, base).href === url.href)) {
    event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
  }
});
