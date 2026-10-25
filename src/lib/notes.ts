import { currentKey } from '../data/archive.ts'
import { decrypt, encrypt, writeToken } from './vault.ts'

// Names and places that classmates add to photos. They are kept by a small
// Cloudflare Worker (cloudflare/notes-worker.js) as scrambled blobs, one per
// photo: the browser encrypts them with the key from the class code before
// sending, so the service never sees the words. Set-up: docs/naming-setup.md.

/** The Worker's address. Empty until it has been set up; the site then hides naming. */
export const NOTES_URL = ''

export type NoteVersion = { people: string; place: string; at: string }
export type Notes = NoteVersion & {
  /** Earlier versions, newest first, so a mistake can be put right. */
  history: NoteVersion[]
}

const HISTORY = 20
const cache = new Map<string, Promise<Notes | null>>()

export const notesEnabled = () => Boolean(NOTES_URL)

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export function getNotes(photoId: string): Promise<Notes | null> {
  let p = cache.get(photoId)
  if (!p) {
    p = (async () => {
      const key = currentKey()
      if (!key || !NOTES_URL) return null
      const res = await fetch(`${NOTES_URL}/notes/${encodeURIComponent(photoId)}`)
      if (res.status === 404) return null
      if (!res.ok) throw new Error('The names could not be loaded just now.')
      const { data } = (await res.json()) as { data: string }
      const plain = await decrypt(key, unb64(data).buffer as ArrayBuffer)
      return JSON.parse(new TextDecoder().decode(plain)) as Notes
    })()
    p.catch(() => cache.delete(photoId))
    cache.set(photoId, p)
  }
  return p
}

/** Saves new names or place, keeping the version it replaces in the history. */
export async function saveNotes(photoId: string, change: Partial<Pick<Notes, 'people' | 'place'>>): Promise<Notes> {
  const key = currentKey()
  if (!key || !NOTES_URL) throw new Error('Naming is not set up yet.')
  // Read the latest first, so two people editing do not undo each other.
  cache.delete(photoId)
  const before = await getNotes(photoId)
  const next: Notes = {
    people: (change.people ?? before?.people ?? '').trim().slice(0, 600),
    place: (change.place ?? before?.place ?? '').trim().slice(0, 120),
    at: new Date().toISOString(),
    history: before ? [{ people: before.people, place: before.place, at: before.at }, ...before.history].slice(0, HISTORY) : [],
  }
  const body = JSON.stringify({ data: b64(await encrypt(key, new TextEncoder().encode(JSON.stringify(next)))) })
  const res = await fetch(`${NOTES_URL}/notes/${encodeURIComponent(photoId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Archive-Token': await writeToken(key) },
    body,
  })
  if (!res.ok) throw new Error(res.status === 403 ? 'The class code was not accepted for saving.' : 'Could not save just now. Please try again.')
  cache.set(photoId, Promise.resolve(next))
  return next
}
