import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setKey, verifyKey } from './data/archive.ts'
import { deriveKey, forgetKey, isCodeShape, rememberedKey, rememberKey } from './lib/vault.ts'

// Whether this device has the class code. "checking" while a remembered key
// is being tried on page load.
type Status = 'checking' | 'locked' | 'open'

type Access = {
  status: Status
  /** Tries a code. Resolves to a message to show, or null when it worked. */
  unlock: (code: string) => Promise<string | null>
  /** Forgets the code on this device. */
  lock: () => Promise<void>
}

const AccessContext = createContext<Access | null>(null)

export function AccessProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    let live = true
    rememberedKey()
      .then(async (k) => (k ? verifyKey(k) : false))
      .then(
        (ok) => live && setStatus(ok ? 'open' : 'locked'),
        () => live && setStatus('locked'),
      )
    return () => {
      live = false
    }
  }, [])

  const unlock = useCallback(async (code: string) => {
    const clean = code.replace(/\D/g, '')
    if (!isCodeShape(clean)) return 'The code is 8 digits.'
    try {
      const k = await deriveKey(clean)
      if (!(await verifyKey(k))) return 'That code is not right. Check it and try again.'
      await rememberKey(k)
      setStatus('open')
      return null
    } catch {
      return 'The site could not check the code just now. Please check your connection and try again.'
    }
  }, [])

  const lock = useCallback(async () => {
    setKey(null)
    await forgetKey()
    setStatus('locked')
  }, [])

  const value = useMemo(() => ({ status, unlock, lock }), [status, unlock, lock])
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const ctx = useContext(AccessContext)
  if (!ctx) throw new Error('useAccess outside AccessProvider')
  return ctx
}
