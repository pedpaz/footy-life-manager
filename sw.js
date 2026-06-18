// Footy Life Manager — Service Worker
// Estratégia NETWORK-FIRST: sempre busca a versão nova online (atualização
// automática forçada); só usa cache como reserva quando estiver offline.
const CACHE = 'flm-cache-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // novo SW assume na hora
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))); // limpa caches velhos
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req); // tenta SEMPRE a rede primeiro
      try {
        if (new URL(req.url).origin === location.origin && fresh && fresh.status === 200) {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()); // guarda só same-origin pra reserva offline
        }
      } catch (_e) {}
      return fresh;
    } catch (err) {
      const cached = await caches.match(req); // offline → reserva
      if (cached) return cached;
      throw err;
    }
  })());
});
