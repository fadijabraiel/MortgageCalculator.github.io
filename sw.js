const CACHE_PREFIX = 'mortgage-pro-auto-';
const FALLBACK_VERSION = 'v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon.png'];

async function getCacheName() {
  try {
    const response = await fetch('./index.html', { cache: 'no-store' });
    if (response.ok) {
      const html = await response.text();
      const match = html.match(/<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i)
                 || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']app-version["']/i);
      if (match && match[1]) {
        return CACHE_PREFIX + match[1].trim();
      }
    }
  } catch (err) {
    // Fallback if offline during install/activate
  }
  return CACHE_PREFIX + FALLBACK_VERSION;
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
    getCacheName().then(cacheName =>
      caches.keys().then(keys =>
        Promise.all(keys.filter(key => key !== cacheName).map(key => caches.delete(key)))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          getCacheName().then(cacheName =>
            caches.open(cacheName).then(cache => cache.put(event.request, copy))
          );
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
