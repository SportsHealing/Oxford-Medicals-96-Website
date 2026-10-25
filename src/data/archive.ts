import { asset } from '../asset.ts'
import { categoryOrder } from '../lib/photoCategories.ts'
import { decrypt, type VaultKey } from '../lib/vault.ts'
import type { Photo, PhotosFile, Speech, SpeechesFile, SpeechQuote } from './types.ts'

// Reads the encrypted archive under /archive with the key from the class code.
// Decrypted pictures are kept as object URLs for the visit; the encrypted
// files themselves are kept on the device by the service worker (public/sw.js).

const ARCHIVE = '/archive'

let key: VaultKey | null = null
const files = new Map<string, Promise<ArrayBuffer>>()
const urls = new Map<string, Promise<string>>()
let speechesCache: Promise<SpeechesFile> | null = null
let photosCache: Promise<PhotosFile | null> | null = null

export function setKey(k: VaultKey | null) {
  key = k
  files.clear()
  for (const p of urls.values()) p.then(URL.revokeObjectURL, () => {})
  urls.clear()
  speechesCache = null
  photosCache = null
}

export class WrongCode extends Error {}

// The two lists can be republished in place, so they follow normal caching;
// pictures never change under their path. "reload" skips every cache.
async function fetchFile(path: string, mode: RequestCache): Promise<ArrayBuffer> {
  const res = await fetch(asset(`${ARCHIVE}/${path}`), { cache: mode })
  // Some hosts answer a missing file with the site's own HTML page and a 200.
  if (res.status === 404 || (res.headers.get('content-type') ?? '').includes('text/html')) throw new Missing(path)
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`)
  return res.arrayBuffer()
}
const isList = (path: string) => !path.includes('/')

export class Missing extends Error {
  constructor(path: string) {
    super(`${path} is not published`)
  }
}

// Fetches and decrypts one archive file, once.
export function readFile(path: string): Promise<ArrayBuffer> {
  if (!key) return Promise.reject(new WrongCode('Locked'))
  const k = key
  let p = files.get(path)
  if (!p) {
    p = fetchFile(path, isList(path) ? 'default' : 'force-cache').then(async (buf) => {
      try {
        return await decrypt(k, buf)
      } catch {
        // A copy saved on this device from before the archive was rebuilt
        // with a new code: fetch it fresh once before giving up.
        const fresh = await fetchFile(path, 'reload')
        try {
          return await decrypt(k, fresh)
        } catch {
          throw new WrongCode('That code does not open this archive')
        }
      }
    })
    p.catch(() => files.delete(path))
    files.set(path, p)
  }
  return p
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await readFile(path))) as T
}

/** True once the given key opens the archive; false for a wrong code. */
export async function verifyKey(k: VaultKey): Promise<boolean> {
  setKey(k)
  try {
    await loadSpeeches()
    return true
  } catch (e) {
    if (e instanceof WrongCode) {
      setKey(null)
      return false
    }
    // The archive could not be fetched at all: let the caller decide.
    throw e
  }
}

export function loadSpeeches(): Promise<SpeechesFile> {
  speechesCache ??= readJson<SpeechesFile>('speeches.enc').then((f) => ({
    speeches: [...f.speeches].sort((a, b) => (b.year ?? -1) - (a.year ?? -1)),
    quotes: f.quotes,
  }))
  speechesCache.catch(() => (speechesCache = null))
  return speechesCache
}

export const listSpeeches = async (): Promise<Speech[]> => (await loadSpeeches()).speeches
export const listQuotes = async (): Promise<SpeechQuote[]> => (await loadSpeeches()).quotes
export const getSpeech = async (slug: string): Promise<Speech | null> =>
  (await loadSpeeches()).speeches.find((s) => s.slug === slug) ?? null

export function speechPdfBlob(speech: Speech): Blob | null {
  if (!speech.pdf) return null
  const bytes = Uint8Array.from(atob(speech.pdf.base64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: 'application/pdf' })
}

/** The photo list, or null while the photos have not been published yet. */
export function loadPhotos(): Promise<PhotosFile | null> {
  photosCache ??= readJson<PhotosFile>('photos.enc')
    .then((f) => ({
      ...f,
      photos: [...f.photos].sort(
        (a, b) =>
          categoryOrder(a.category) - categoryOrder(b.category) ||
          (a.year ?? '9999').localeCompare(b.year ?? '9999') ||
          a.title.localeCompare(b.title),
      ),
    }))
    .catch((e: unknown) => {
      if (e instanceof Missing) return null
      throw e
    })
  photosCache.catch(() => (photosCache = null))
  return photosCache
}

export const listPhotos = async (): Promise<Photo[]> => (await loadPhotos())?.photos ?? []
export const getPhoto = async (id: string): Promise<Photo | null> => (await listPhotos()).find((p) => p.id === id) ?? null

/** An object URL for a decrypted picture, made once per visit. */
export function pictureUrl(path: string): Promise<string> {
  let p = urls.get(path)
  if (!p) {
    p = readFile(path).then((buf) => URL.createObjectURL(new Blob([buf], { type: 'image/jpeg' })))
    p.catch(() => urls.delete(path))
    urls.set(path, p)
  }
  return p
}
