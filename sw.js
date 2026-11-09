// Service worker : met en cache le « shell » de l'appli pour un démarrage
// 100 % hors-ligne. Stratégie stale-while-revalidate sur les GET même origine.

const CACHE = "caisse-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Racine de l'appli relative au SW (gère un hébergement en sous-chemin).
  const racine = new URL("./", self.location.href).href;
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(racine).catch(() => undefined))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const enCache = await cache.match(req);
      const reseau = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => enCache);
      return enCache || reseau;
    })
  );
});
