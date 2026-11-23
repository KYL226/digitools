/* DigiTools Service Worker
 *
 * Strategies:
 *  - App shell (HTML, JS chunks, CSS, fonts, manifest, icons):
 *    cache-first with background revalidation. Lets the app launch offline.
 *  - Static assets in /public (logo, icons, ffmpeg WASM):
 *    stale-while-revalidate — serve from cache, update in background.
 *  - API + dynamic requests (/api/*):
 *    network-only — never cache dynamic content.
 *  - Same-origin navigations: network-first, fallback to cached shell.
 *
 * Version bump (CACHE_VERSION) forces a refresh on the next visit.
 */

const CACHE_VERSION = "digitools-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

// Resources pre-cached on install. We list the most essential ones; the rest
// (lazy chunks, fonts) are added on-demand on first fetch.
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/logo.svg",
  "/logo-digi.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
  "/favicon-16.png",
  "/apple-touch-icon.png",
  "/og-image.png",
];

// Routes that should ALWAYS go to the network (never cached).
const NETWORK_ONLY = (url) => {
  if (url.pathname.startsWith("/api/")) return true;
  // FFmpeg WASM is 32MB — we let the browser HTTP cache handle it (it does
  // range requests and partial content properly). Don't shadow it in SW cache.
  if (url.pathname.startsWith("/ffmpeg/ffmpeg-core.wasm")) return true;
  return false;
};

// Same-origin assets that benefit from stale-while-revalidate.
const SWR_ASSET = (url) => {
  if (url.origin !== self.location.origin) return false;
  if (NETWORK_ONLY(url)) return false;
  // Static assets
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico|wasm)$/i.test(
      url.pathname
    ) ||
    url.pathname === "/manifest.webmanifest"
  );
};

// App-shell HTML and navigations: network-first with cache fallback.
const IS_NAVIGATION = (req) =>
  req.mode === "navigate" ||
  (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Use addAll but tolerate individual failures (so a 404 on one
      // resource doesn't break installation).
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: "reload" }));
          } catch (e) {
            console.warn(`[SW] precache miss for ${url}:`, e.message);
          }
        })
      );
      // Activate immediately so the SW takes control on first load.
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches (anything not in our current version).
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      );
      // Take control of all open clients.
      await self.clients.claim();
      console.log("[SW] DigiTools service worker active (v1)");
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET requests; let everything else pass through.
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return; // malformed URL, let the browser handle it
  }

  // 1. Network-only for API / FFmpeg WASM
  if (NETWORK_ONLY(url)) {
    return; // default: browser fetches it
  }

  // 2. Navigations: network-first, fall back to cached shell.
  if (IS_NAVIGATION(req)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          // Cache the latest shell for offline use.
          const cache = await caches.open(SHELL_CACHE);
          cache.put("/", fresh.clone()).catch(() => {});
          return fresh;
        } catch (e) {
          // Offline: serve the cached shell (or a fallback).
          const cache = await caches.open(SHELL_CACHE);
          const cached = await cache.match("/");
          if (cached) return cached;
          return new Response(
            "<h1>Offline</h1><p>DigiTools is offline. Please reconnect.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
      })()
    );
    return;
  }

  // 3. Stale-while-revalidate for static assets
  if (SWR_ASSET(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        // Kick off a background fetch to update the cache.
        const networkFetch = fetch(req)
          .then((resp) => {
            // Only cache successful, same-origin, non-opaque responses.
            if (resp.ok && resp.type === "basic") {
              cache.put(req, resp.clone()).catch(() => {});
            }
            return resp;
          })
          .catch(() => null);
        // Return cached immediately if available, else wait for network.
        return cached || (await networkFetch) || Response.error();
      })()
    );
    return;
  }

  // 4. Default: try cache, fall back to network
  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        if (resp.ok && resp.type === "basic") {
          cache.put(req, resp.clone()).catch(() => {});
        }
        return resp;
      } catch (e) {
        return Response.error();
      }
    })()
  );
});

// Allow the page to ask the SW to update immediately (used by the "update
// available" toast if we add one later).
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
