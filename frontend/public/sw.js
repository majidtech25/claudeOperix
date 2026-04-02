const CACHE = 'operix-v3'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.add('/'))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Skip non-GET requests
  if (e.request.method !== 'GET') return

  // Skip API calls — always go to network
  if (e.request.url.includes('/api/')) return

  // Skip cross-origin requests
  if (!e.request.url.startsWith(self.location.origin)) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => {
        // Offline: always serve root for navigation
        return caches.match('/')
      })
  )
})

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})