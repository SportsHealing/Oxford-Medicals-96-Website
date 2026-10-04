import { createContext, useContext, useState, type ReactNode } from 'react'

// Phase A: a pretend sign-in so the prototype can be clicked through.
// Phase B replaces this with real email sign-in (Supabase Auth).

type Auth = {
  email: string | null
  signIn: (email: string) => void
  signOut: () => void
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
  const [email, setEmail] = useState<string | null>(readStored)

  const signIn = (value: string) => {
    setEmail(value)
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* storage unavailable, session only */
    }
  }
  const signOut = () => {
    setEmail(null)
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  }

  return <AuthContext.Provider value={{ email, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
