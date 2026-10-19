// Keeps photo links and photo files on this device, so each photo is
// downloaded from Supabase once rather than on every visit. Supabase's free
// plan has a monthly download allowance, and 800 photos use it up quickly.

const LINKS_KEY = (bucket: string) => `om96.signed.${bucket}`
export const PHOTO_CACHE = 'om96-photos-v1'

// A link is signed for 3 days and reused while it has at least 12 hours left.
// Reusing the same link is what lets the browser keep the photo.
export const SIGN_SECONDS = 3 * 24 * 60 * 60
const REUSE_MS = 12 * 60 * 60 * 1000

type Stored = Record<string, [url: string, expiresAt: number]>

function read(bucket: string): Stored {
  try {
    return JSON.parse(localStorage.getItem(LINKS_KEY(bucket)) ?? '{}') as Stored
  } catch {
    return {}
  }
}

export function cachedLinks(bucket: string, paths: string[]) {
  const stored = read(bucket)
  const now = Date.now()
  const hit = new Map<string, string>()
  for (const p of paths) {
    const s = stored[p]
    if (s && s[1] - now > REUSE_MS) hit.set(p, s[0])
  }
  return hit
}

export function storeLinks(bucket: string, fresh: Map<string, string>) {
  if (fresh.size === 0) return
  const stored = read(bucket)
  const now = Date.now()
  const expiresAt = now + SIGN_SECONDS * 1000
  // Drop links that have run out, so the store does not grow for ever.
  for (const [p, s] of Object.entries(stored)) if (s[1] <= now) delete stored[p]
  for (const [p, url] of fresh) stored[p] = [url, expiresAt]
  try {
    localStorage.setItem(LINKS_KEY(bucket), JSON.stringify(stored))
  } catch {
    /* storage full or blocked: links still work, just not reused */
  }
}

// On signing out, forget the links and the saved photos on this device.
export async function forgetPhotos() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('om96.signed.')) localStorage.removeItem(k)
  } catch {
    /* ignore */
  }
  try {
    if ('caches' in window) await caches.delete(PHOTO_CACHE)
  } catch {
    /* ignore */
  }
}
