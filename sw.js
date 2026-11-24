const CACHE_PREFIX = 'mortgage-pro-auto-';
const ASSETS = ['./', './index.html', './manifest.json', './icon.png'];

async function getCacheName() {
  try {
    const res = await fetch('./index.html', { cache: 'no-store' });
    const html = await res.text();
    const match = html.match(/<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i);
    const version = (match && match[1]) ? match[1].trim() : 'v1';
    return `${CACHE_PREFIX}${version}`;
  } catch (e) {
    return `${CACHE_PREFIX}v1`;
  }
}


self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    getCacheName().then(cacheName =>
      caches.open(cacheName).then(cache => cache.addAll(ASSETS))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    getCacheName().then(activeCache =>
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith(CACHE_PREFIX) && key !== activeCache)
            .map(key => caches.delete(key))
        )
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    getCacheName().then(cacheName =>
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(cacheName).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    )
  );
});
