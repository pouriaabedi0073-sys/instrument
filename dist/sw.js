const CACHE_NAME = 'precisionpro-shell-v1'
const appRoot = new URL('./', self.registration.scope)
const manifestUrl = new URL('manifest.webmanifest', appRoot)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([appRoot.href, manifestUrl.href]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
      }
      return response
    }).catch(async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      if (request.mode === 'navigate') {
        const appShell = await caches.match(appRoot.href)
        if (appShell) return appShell
      }
      return Response.error()
    }),
  )
})
