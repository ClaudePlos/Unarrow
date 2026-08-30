/* Service worker: gra działa offline po pierwszym wejściu.
 *
 * Strategia: stale-while-revalidate. Odpowiedź idzie natychmiast z cache
 * (więc offline działa i start jest szybki), a w tle pobierana jest świeża
 * wersja na następne uruchomienie. Zwykłe cache-first potrafiłoby przykleić
 * gracza do starej wersji aż do ręcznej zmiany numeru cache.
 */
const CACHE = 'unarrow-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/rng.js',
  './js/generator.js',
  './js/geometry.js',
  './js/sfx.js',
  './js/game.js',
  './js/pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    const fresh = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(fresh);   // odświeżenie w tle, nie blokuje odpowiedzi
      return cached;
    }

    const res = await fresh;
    if (res) return res;

    // Offline, bez trafienia w cache: dla nawigacji oddaj powłokę aplikacji.
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    return Response.error();
  })());
});
