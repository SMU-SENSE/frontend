// Only public, account-independent assets may be stored offline.
// Never cache authenticated pages: the same browser may later be used by another guardian.
const CACHE = 'malmoa-guardian-mplus-v2'
const SHELL = ['/welcome', '/malmoa-guardian.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('malmoa-guardian-') && key !== CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    // Network-only for every navigation, including /welcome. No personalized HTML
    // can be served to a different account after logout or during an outage.
    event.respondWith(
      fetch(event.request).catch(async () => {
        const response = await caches.match('/welcome')
        return response || Response.error()
      }),
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname === '/malmoa-guardian.svg') {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)))
        }
        return response
      })),
    )
  }
})
