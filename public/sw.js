// Oxford Medics 96: keeps photos and profile pictures on this device.
//
// Photos come from Supabase Storage through signed links whose token changes
// from time to time. The file at a given path never changes (new uploads get
// new paths), so this saves each one under its path without the token and
// serves it from here next time. Everything else goes to the network as usual.

const CACHE = 'om96-photos-v1'
const MAX_ENTRIES = 3000
const SIGNED = /\/storage\/v1\/object\/sign\/(photos|avatars)\//

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (!SIGNED.test(url.pathname)) return
  event.respondWith(fromCacheOrNetwork(req, url.origin + url.pathname))
})

async function fromCacheOrNetwork(req, key) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(key)
  if (hit) return hit
  let res
  try {
    // A CORS request gives a readable response, which caches at its real size.
    res = await fetch(req.url, { mode: 'cors', credentials: 'omit' })
  } catch {
    return fetch(req)
  }
  if (res.ok && res.type !== 'opaque') {
    const copy = res.clone()
    cache
      .put(key, copy)
      .then(() => trim(cache))
      .catch(() => {})
  }
  return res
}

async function trim(cache) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - MAX_ENTRIES; i++) await cache.delete(keys[i])
}
