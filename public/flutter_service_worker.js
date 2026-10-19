// Clean-up for browsers that opened the earlier Flutter build of this site.
// That build installed a service worker which keeps serving the old app. This
// file replaces it with one that clears the old caches, removes itself and
// reloads the page so the current app loads.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((c) => c.navigate(c.url))
    })(),
  )
})
