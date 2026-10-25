// Oxford Medics 96: keeps the encrypted archive files on this device.
//
// The files under /archive never change once published (a rebuilt archive
// gets new file names), so each is fetched once and served from here after
// that. They are useless without the class code. Everything else goes to the
// network as usual.

const CACHE = 'om96-archive-v1'
const MAX_ENTRIES = 4000

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin || !/\/archive\/.+\.enc$/.test(url.pathname)) return
  // The two lists (photos.enc, speeches.enc) can be republished in place, so
  // they are always fetched fresh when the network is there.
  const list = /\/archive\/[^/]+\.enc$/.test(url.pathname)
  // The page asks for a fresh copy when a saved one will not open.
  event.respondWith(req.cache === 'reload' || list ? networkFirst(req) : cacheFirst(req))
})

async function cacheFirst(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req.url)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) {
    cache
      .put(req.url, res.clone())
      .then(() => trim(cache))
      .catch(() => {})
  }
  return res
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req.url, res.clone()).catch(() => {})
    return res
  } catch {
    const hit = await cache.match(req.url)
    if (hit) return hit
    throw new Error('offline')
  }
}

async function trim(cache) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - MAX_ENTRIES; i++) await cache.delete(keys[i])
}
