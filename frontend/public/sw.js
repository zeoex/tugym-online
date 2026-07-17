/* Service worker de TuGymOnLine.
   Regla de oro: la API va SIEMPRE a la red. Solo se cachea el shell
   (navegaciones, red primero) y los assets con hash o imágenes (cache primero). */
const CACHE = 'tugym-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navegación: red primero, y si no hay señal servimos el shell cacheado.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copia));
          return r;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets hasheados, imágenes y fuentes: cache primero (son inmutables).
  if (url.pathname.startsWith('/assets/') || /\.(png|jpg|jpeg|webp|svg|gif|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit ||
        fetch(e.request).then((r) => {
          if (r.ok) {
            const copia = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
          }
          return r;
        })
      )
    );
  }
});
