const CACHE_NAME = "hotel-pos-cache-v6";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/Hot_Chick_Logo.png",
  "/sw.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          return cachedPage || caches.match("/");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          if (!isSameOrigin && response.type === "opaque") {
            return response;
          }

          const copied = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copied));
          return response;
        })
        .catch(async () => {
          if (isSameOrigin) {
            const fallback = await caches.match("/");
            if (fallback) return fallback;
          }
          throw new Error("Offline request failed");
        });
    })
  );
});
