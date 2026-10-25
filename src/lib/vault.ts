// The photos and speeches are published as encrypted files. The key is made
// from the class code, which is never stored in the site: a wrong code simply
// fails to decrypt. scripts/build-archive.mjs encrypts with the same recipe.
//
// Key: PBKDF2-SHA256(code, SALT, 600,000 rounds) -> AES-256-GCM.
// File: 12-byte random IV, then the ciphertext with its 16-byte tag.

const SALT = 'oxfordmedics96-archive-v1'
const ROUNDS = 600_000
const KEY_STORE = 'om96.key'

export type VaultKey = CryptoKey

export const isCodeShape = (code: string) => /^\d{8}$/.test(code)

export async function deriveKey(code: string): Promise<VaultKey> {
  const enc = new TextEncoder()
  const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(SALT), iterations: ROUNDS },
    base,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt'],
  )
}

export async function decrypt(key: VaultKey, file: ArrayBuffer): Promise<ArrayBuffer> {
  if (file.byteLength < 12 + 16) throw new Error('Not an archive file')
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: file.slice(0, 12) }, key, file.slice(12))
}

// Remembering the key on this device means the code is typed once per device.
export async function rememberKey(key: VaultKey) {
  try {
    const raw = await crypto.subtle.exportKey('raw', key)
    localStorage.setItem(KEY_STORE, btoa(String.fromCharCode(...new Uint8Array(raw))))
  } catch {
    /* private browsing or storage blocked: the code is asked for next time */
  }
}

export async function rememberedKey(): Promise<VaultKey | null> {
  try {
    const b64 = localStorage.getItem(KEY_STORE)
    if (!b64) return null
    const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['decrypt'])
  } catch {
    return null
  }
}

export async function forgetKey() {
  try {
    localStorage.removeItem(KEY_STORE)
  } catch {
    /* ignore */
  }
  try {
    if ('caches' in window) await caches.delete('om96-archive-v1')
  } catch {
    /* ignore */
  }
}
