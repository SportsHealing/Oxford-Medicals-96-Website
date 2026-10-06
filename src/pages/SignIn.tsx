import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'
import { isLive } from '../lib/supabase.ts'

export default function SignIn() {
  const { email: signedInAs, requestLink, verifyCode, signInWithPassword, prototypeSignIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/photos'
  if (signedInAs) return <Navigate to={from} replace />

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value) return
    setBusy(true)
    setError(null)
    const problem = await requestLink(value)
    setBusy(false)
    if (problem) setError(problem)
    else setSent(true)
  }

  const withPassword = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value || !password) return
    setBusy(true)
    setError(null)
    const problem = await signInWithPassword(value, password)
    setBusy(false)
    if (problem) setError(problem)
    else navigate(from, { replace: true })
  }

  const checkCode = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const problem = await verifyCode(email.trim().toLowerCase(), code)
    setBusy(false)
    if (problem) setError(problem)
    else navigate(from, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card overflow-hidden">
        <div className="ribbon h-1.5" />
        <div className="p-8 sm:p-10">
        <img src={asset('/rita.svg')} alt="" className="h-12 w-12" />
        <h1 className="mt-5 text-3xl">Member sign in</h1>

        {!sent ? (
          <form onSubmit={(e) => void (password ? withPassword(e) : sendCode(e))} className="mt-6 space-y-5">
            <p className="text-muted">
              Sign in with your password, or leave it blank and we will email you a 6-digit code.
            </p>
            <label className="block">
              <span className="label-caps">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                className="field mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="label-caps">Password (if you have set one)</span>
              <input
                type="password"
                autoComplete="current-password"
                className="field mt-1.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to get a code by email"
              />
            </label>
            {error && <p className="text-sm text-pink-deep">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'One moment…' : password ? 'Sign in' : 'Email me a code'}
            </button>
            <p className="text-sm text-muted">
              Use the address the organisers have for you. Forgotten your password? Leave it blank,
              sign in with a code, then set a new one on your Me page.
            </p>
          </form>
        ) : (
          <form onSubmit={(e) => void checkCode(e)} className="mt-6 space-y-5">
            <h2 className="text-xl">Check your inbox</h2>
            <p className="text-muted">
              We have emailed a 6-digit code to <strong className="text-ink">{email}</strong>. Type it
              below. It works for one hour.
            </p>
            <label className="block">
              <span className="label-caps">Code</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]*"
                required
                className="field mt-1.5 text-center font-mono text-2xl tracking-[0.4em]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                autoFocus
              />
            </label>
            {error && <p className="text-sm text-pink-deep">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy || code.replace(/\D/g, '').length < 6}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
            <div className="flex justify-between font-sans text-sm text-muted">
              <button type="button" className="hover:text-navy" onClick={() => { setSent(false); setCode(''); setError(null) }}>
                Use a different email
              </button>
              <button type="button" className="hover:text-navy" disabled={busy} onClick={(e) => void sendCode(e)}>
                Send a new code
              </button>
            </div>
            {!isLive && (
              <div className="rounded-xl bg-blush p-5">
                <p className="label-caps text-pink-deep">Prototype shortcut</p>
                <p className="mt-1 text-sm text-muted">No email is sent in prototype mode.</p>
                <button type="button" onClick={() => prototypeSignIn(email.trim())} className="btn-pink mt-4">
                  Pretend the code was right
                </button>
              </div>
            )}
          </form>
        )}
        </div>
      </div>
    </div>
  )
}
