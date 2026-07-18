/* ============================================================
   sw.js, minimal offline-first service worker.
   Caches the app shell + data on install, serves cache-first for
   static assets and network-first (with cache fallback) for data
   JSON so visitors get last-known-good data when offline.

   v2 fix: navigation requests from the browser have their redirect
   mode forced to "manual" by the Fetch/Service Worker spec. If the
   network response we hand back via respondWith() was itself the
   result of following a redirect (response.redirected === true),
   Chrome refuses it with:
     "a redirected response was used for a request whose redirect
      mode is not 'follow'" -> ERR_FAILED, page never loads.
   safeResponse() strips that flag by rebuilding a plain Response
   from the same body/status/headers before it's ever cached or
   returned, so this can't happen even if a future redirect (from
   a CDN, a Vercel rewrite, etc.) is introduced upstream.
   ============================================================ */

const CACHE_VERSION = "npd-cache-v15";
const PAGES = [
  "index.html", "directory.html", "houses.html", "government.html",
  "member.html", "leadership.html", "committees.html", "statistics.html",
  "downloads.html", "about.html", "offline.html", "404.html",
];
const APP_SHELL = [
  "/",
  "/index.html",
  ...PAGES.map((p) => `/ne/${p}`),
  ...PAGES.map((p) => `/en/${p}`),
  "/assets/css/style.css?v=20260717a",
  "/assets/css/immersive.css?v=20260717a",
  "/assets/js/app.js?v=20260717a",
  "/assets/js/i18n.js?v=20260717a",
  "/assets/js/page-boot.js?v=20260717a",
  "/assets/js/home.js?v=20260717a",
  "/assets/js/houses.js?v=20260717a",
  "/assets/js/government.js?v=20260717a",
  "/assets/js/filters.js?v=20260717a",
  "/assets/js/member.js?v=20260717a",
  "/assets/js/leadership.js?v=20260717a",
  "/assets/js/committees.js?v=20260717a",
  "/assets/js/statistics.js?v=20260717a",
  "/assets/js/downloads.js?v=20260717a",
  "/assets/js/search.js?v=20260717a",
  "/assets/js/charts.js?v=20260717a",
  "/assets/images/emblem.svg",
];

const DATA_PATHS = [
  "/assets/data/members.json",
  "/assets/data/leadership.json",
  "/assets/data/committees.json",
  "/assets/data/statistics.json",
  "/assets/data/province_seats.json",
  "/assets/data/nepal_districts.json",
  "/assets/data/government_sites.json",
];

function safeResponse(response) {
  if (response && response.redirected) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll fails the whole batch if any single request 404s/redirects;
      // add individually so one bad entry can't break the entire install.
      Promise.all(APP_SHELL.map((url) =>
        fetch(url, { redirect: "follow" })
          .then((res) => cache.put(url, safeResponse(res)))
          .catch(() => {})
      ))
    )
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
  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    return; // let the browser handle it normally
  }
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  const isData = DATA_PATHS.some((p) => url.pathname.endsWith(p));

  if (isData) {
    // Network-first for data so visitors get fresh info when online,
    // falling back to the last cached copy when offline.
    event.respondWith(
      fetch(event.request, { redirect: "follow" })
        .then((res) => {
          const safe = safeResponse(res);
          const clone = safe.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone)).catch(() => {});
          return safe;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for the app shell and static assets; network fallback
  // with an offline page for navigations that fail entirely.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request, { redirect: "follow" })
        .then((res) => {
          const safe = safeResponse(res);
          const clone = safe.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone)).catch(() => {});
          return safe;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            const lang = event.request.url.includes("/en/") ? "en" : "ne";
            return caches.match(`/${lang}/offline.html`);
          }
        });
    }).catch(() => fetch(event.request))
  );
});
