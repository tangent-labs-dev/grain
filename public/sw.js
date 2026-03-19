const CACHE_NAME = "grain-v2";
const APP_SHELL = [
  "/",
  "/transactions",
  "/transactions/new",
  "/categories",
  "/settings",
  "/budgets",
  "/insights",
  "/wallets",
  "/transfers",
  "/goals",
  "/templates",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Keep SW install reliable even if one route fails to precache.
      await Promise.all(
        APP_SHELL.map(async (path) => {
          try {
            const response = await fetch(path, { cache: "no-store" });
            if (!response.ok) return;
            await cache.put(path, response);
          } catch {
            // Ignore individual failures during install.
          }
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match("/"))),
  );
});
