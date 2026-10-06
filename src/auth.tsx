import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { SAMPLE_ME } from './data/sample.ts'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase.ts'

// Two modes:
// - Live: Supabase magic-link sign-in. A person counts as a member only if
//   the database created a members row for them (email on the allowed list).
// - Prototype: no Supabase configured. Any email "signs in" as a sample
//   member so the site can be clicked through.

type Auth = {
  loading: boolean
  email: string | null
  /** The signed-in member's id, or null if not signed in or not a member. */
  memberId: string | null
  isAdmin: boolean
  /** Emails a 6-digit code. Returns an error message, or null on success. */
  requestLink: (email: string) => Promise<string | null>
  /** Checks the 6-digit code. Returns an error message, or null on success. */
  verifyCode: (email: string, code: string) => Promise<string | null>
  /** Email + password sign-in. Returns an error message, or null on success. */
  signInWithPassword: (email: string, password: string) => Promise<string | null>
  /** Sets or changes the signed-in member's password. */
  setPassword: (password: string) => Promise<string | null>
  /** True the first time a member signs in, until they set a password or skip. */
  needsPasswordPrompt: boolean
  /** Closes the first-sign-in prompt for good, optionally setting a password. */
  finishPasswordPrompt: (password?: string) => Promise<string | null>
  /** Prototype only: pretend the link was clicked. */
  prototypeSignIn: (email: string) => void
  signOut: () => Promise<void>
  /** Re-read the member row (after editing a profile, for example). */
  refresh: () => Promise<void>
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
  const live = supabase !== null
  const storedEmail = live ? null : readStored()
  const [loading, setLoading] = useState(live)
  const [email, setEmail] = useState<string | null>(storedEmail)
  const [memberId, setMemberId] = useState<string | null>(storedEmail ? SAMPLE_ME : null)
  const [isAdmin, setIsAdmin] = useState(Boolean(storedEmail))
  const [needsPasswordPrompt, setNeedsPasswordPrompt] = useState(false)

  // Which account the membership check is for, so a token refresh for the
  // same person does not blank the page, and a slow, outdated check cannot
  // overwrite a newer one.
  const checkedFor = useRef<string | null>(null)
  const latest = useRef(0)

  const apply = useCallback(async (user: User | null) => {
    if (!supabase) return
    const run = ++latest.current
    if (!user) {
      checkedFor.current = null
      setEmail(null)
      setMemberId(null)
      setIsAdmin(false)
      setNeedsPasswordPrompt(false)
      setLoading(false)
      return
    }
    // New person: show "checking" until we know whether they are a member,
    // instead of briefly showing the "not on the list" page.
    if (checkedFor.current !== user.id) setLoading(true)
    const { data } = await supabase.from('members').select('id, is_admin').eq('id', user.id).maybeSingle()
    if (run !== latest.current) return
    checkedFor.current = user.id
    // Set everything together so pages never see the email without the membership.
    setEmail(user.email ?? null)
    setMemberId(data?.id ?? null)
    setIsAdmin(Boolean(data?.is_admin))
    // Stored on the account, so it is asked once, not once per device.
    setNeedsPasswordPrompt(Boolean(data) && !user.user_metadata?.password_prompt_seen)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    client.auth.getSession().then(({ data }) => {
      void apply(data.session?.user ?? null)
    })
    // Supabase advises not to call the database inside this callback directly;
    // defer it to the next tick.
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void apply(session?.user ?? null), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [apply])

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getUser()
    await apply(data.user ?? null)
  }, [apply])

  const requestLink = async (value: string) => {
    if (!supabase) return null
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: `${window.location.origin}/photos` },
    })
    if (!error) return null
    const m = error.message.toLowerCase()
    if (m.includes('rate limit')) {
      return 'Too many sign-in emails have been sent in the last hour. Please wait a little while and try again.'
    }
    if (m.includes('security purposes') || m.includes('only request this after')) {
      return 'A link was sent a moment ago. Check your inbox, or wait a minute before asking for another.'
    }
    return error.message
  }

  const verifyCode = async (value: string, code: string) => {
    if (!supabase) return null
    const { data, error } = await supabase.auth.verifyOtp({ email: value, token: code.replace(/\D/g, ''), type: 'email' })
    if (!error) {
      // Settle membership before the page moves on, so nothing flashes.
      await apply(data.user ?? null)
      return null
    }
    const m = error.message.toLowerCase()
    if (m.includes('expired') || m.includes('invalid')) {
      return 'That code is wrong or has expired. Check the latest email, or ask for a new code.'
    }
    return error.message
  }

  const signInWithPassword = async (value: string, password: string) => {
    if (!supabase) return null
    const { data, error } = await supabase.auth.signInWithPassword({ email: value, password })
    if (!error) {
      await apply(data.user ?? null)
      return null
    }
    const m = error.message.toLowerCase()
    if (m.includes('invalid login')) {
      return 'Email or password not recognised. If you have not set a password yet, use "Email me a code" instead.'
    }
    return error.message
  }

  const setPassword = async (password: string) => {
    if (!supabase) return null
    const { error } = await supabase.auth.updateUser({ password, data: { password_prompt_seen: true } })
    if (!error) setNeedsPasswordPrompt(false)
    return error ? error.message : null
  }

  const finishPasswordPrompt = async (password?: string) => {
    if (!supabase) {
      setNeedsPasswordPrompt(false)
      return null
    }
    const { error } = await supabase.auth.updateUser(
      password ? { password, data: { password_prompt_seen: true } } : { data: { password_prompt_seen: true } },
    )
    if (error) return error.message
    setNeedsPasswordPrompt(false)
    return null
  }

  const prototypeSignIn = (value: string) => {
    if (supabase) return
    setEmail(value)
    setMemberId(SAMPLE_ME)
    setIsAdmin(true)
    setNeedsPasswordPrompt(true)
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
    setMemberId(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider
      value={{ loading, email, memberId, isAdmin, requestLink, verifyCode, signInWithPassword, setPassword, needsPasswordPrompt, finishPasswordPrompt, prototypeSignIn, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
