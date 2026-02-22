/**
 * No-op service worker — served only to avoid 404 when browser/extensions request /sw.js.
 * Does not cache or intercept; install/activate only so registration succeeds if attempted.
 */
self.addEventListener('install', function () {
  self.skipWaiting();
});
self.addEventListener('activate', function () {
  self.clients.claim();
});
