const CACHE_NAME = 'mba-audio-vault-enc-v2.0.0';

const CORE_ASSETS = [
  './index.html',
  './lecteur_audio_mngt50415.html',
  './lecteur_audio.html',
  './manifest_audio.json',
  './icon_audio_192.png',
  './icon_audio_512.png',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './audio_data/catalog.enc.json',
  './audio_data/full_bundle.enc.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        CORE_ASSETS.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((resp) => {
              if (resp && resp.ok) {
                return cache.put(url, resp);
              }
            })
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith('mba-audio-vault'))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedResp) => {
      const networkFetch = fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.ok) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResp;
        })
        .catch(() => cachedResp);

      // Cache-First avec rafraîchissement en arrière-plan pour un démarrage instantané hors-ligne
      return cachedResp || networkFetch;
    })
  );
});
