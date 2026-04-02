const CACHE = 'operix-v2'  // bumped version to force update

// Only precache real files, NOT SPA routes
const PRECACHE = [
  '/',
  '/index.html',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
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
        // Only cache successful responses
        if (res && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => {
        // Offline fallback — serve index.html for any navigation request
        // This is what makes SPA routing work offline
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
        return caches.match(e.request)
      })
  )
})

// Listen for theme messages from the app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})