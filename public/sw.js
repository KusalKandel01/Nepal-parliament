/* ============================================================
   sw.js — minimal offline-first service worker.
   Caches the app shell + data on install, serves cache-first for
   static assets and network-first (with cache fallback) for data
   JSON so visitors get last-known-good data when offline.
   ============================================================ */

const CACHE_VERSION = "npd-cache-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/directory.html",
  "/member.html",
  "/leadership.html",
  "/committees.html",
  "/statistics.html",
  "/downloads.html",
  "/about.html",
  "/offline.html",
  "/assets/css/style.css",
  "/assets/js/app.js",
  "/assets/js/filters.js",
  "/assets/js/search.js",
  "/assets/js/charts.js",
  "/assets/images/emblem.svg",
];

const DATA_PATHS = [
  "/assets/data/members.json",
  "/assets/data/leadership.json",
  "/assets/data/committees.json",
  "/assets/data/statistics.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  const isData = DATA_PATHS.some((p) => url.pathname.endsWith(p));

  if (isData) {
    // Network-first for data so visitors get fresh info when online,
    // falling back to the last cached copy when offline.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for the app shell and static assets.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => {
          if (event.request.mode === "navigate") return caches.match("/offline.html");
        });
    })
  );
});
