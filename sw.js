/*
 * Minimal offline cache for the card's own static files.
 * - Only same-origin GET requests are handled; external links are never cached.
 * - HTML navigations are network-first, so a new deployment is picked up on the next visit.
 * - Other files are served from cache and refreshed in the background.
 * - `npm run build` stamps CACHE_VERSION with a content hash; old caches are deleted on activate.
 * The app only registers this worker on https:// origins, so local http:// development is unaffected.
 */
const CACHE_VERSION = "dev";
const CACHE_PREFIX = "mina-card-";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "src/styles.css",
  "src/theme-init.js",
  "src/app.js",
  "src/profile.js",
  "src/lib/contact.js",
  "src/lib/qr.js",
  "src/vendor/qrcode.js",
  "assets/profile-placeholder.svg",
  "assets/icons/favicon.svg",
  "assets/icons/favicon-32.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match("index.html")) || Response.error();
  }
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);
  const refresh = fetch(event.request)
    .then((response) => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
    .catch(() => cached || Response.error());
  if (cached) {
    event.waitUntil(refresh.then(() => undefined));
    return cached;
  }
  return refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(event));
});
