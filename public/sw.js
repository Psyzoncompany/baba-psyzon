const CACHE_NAME = 'baba-psyzon-static-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/baba-icon-192.png',
  '/icons/baba-icon-512.png',
  '/img/baba-psyzon-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isSensitiveRequest(url) {
  return url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/oauth/')
    || url.pathname.startsWith('/.well-known/')
    || url.pathname === '/mcp';
}

async function cacheAndReturn(request, response) {
  if (!response.ok || response.type !== 'basic') return response;
  const cacheCopy = response.clone();
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, cacheCopy);
  } catch (error) {
    console.warn('[Baba Psyzon] Não foi possível atualizar o cache estático.', error);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || isSensitiveRequest(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => cacheAndReturn(request, response))
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  if (!['style', 'script', 'image', 'font'].includes(request.destination)) return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      return cacheAndReturn(request, response);
    })),
  );
});
