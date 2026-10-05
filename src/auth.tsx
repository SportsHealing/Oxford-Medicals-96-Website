import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './lib/supabase.ts'

// Two modes:
// - Live: Supabase magic-link sign-in. A person counts as a member only if
//   the database created a members row for them (email on the allowed list).
// - Prototype: no Supabase configured. Any email "signs in" so the site can
//   be clicked through with sample data.

type Auth = {
  loading: boolean
  email: string | null
  /** True once signed in and on the members list. Always true in prototype mode. */
  isMember: boolean
  /** Sends a magic link. Returns an error message, or null on success. */
  requestLink: (email: string) => Promise<string | null>
  /** Prototype only: pretend the link was clicked. */
  prototypeSignIn: (email: string) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)
const KEY = 'om96.email'

function readStored(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(supabase !== null)
  const [email, setEmail] = useState<string | null>(supabase ? null : readStored)
  const [isMember, setIsMember] = useState(supabase === null)

  useEffect(() => {
    if (!supabase) return
    const client = supabase

    const apply = async (userEmail: string | null, userId: string | null) => {
      setEmail(userEmail)
      if (!userId) {
        setIsMember(false)
        setLoading(false)
        return
      }
      const { data } = await client.from('members').select('id').eq('id', userId).maybeSingle()
      setIsMember(Boolean(data))
      setLoading(false)
    }

    client.auth.getSession().then(({ data }) => {
      void apply(data.session?.user.email ?? null, data.session?.user.id ?? null)
    })
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      void apply(session?.user.email ?? null, session?.user.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const requestLink = async (value: string) => {
    if (!supabase) return null
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: `${window.location.origin}/photos` },
    })
    return error ? error.message : null
  }

  const prototypeSignIn = (value: string) => {
    if (supabase) return
    setEmail(value)
    setIsMember(true)
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* storage unavailable, session only */
    }
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    } else {
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* ignore */
      }
    }
    setEmail(null)
    setIsMember(supabase === null)
  }

  return (
    <AuthContext.Provider value={{ loading, email, isMember, requestLink, prototypeSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
