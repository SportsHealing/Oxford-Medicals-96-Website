import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'
import { isLive } from '../lib/supabase.ts'

export default function SignIn() {
  const { email: signedInAs, requestLink, prototypeSignIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/photos'
  if (signedInAs) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
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

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8 sm:p-10">
        <img src={asset('/rita.svg')} alt="" className="h-12 w-12" />
        <h1 className="mt-5 text-3xl">Member sign in</h1>

        {!sent ? (
          <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-5">
            <p className="text-muted">
              Enter your email and we will send you a sign-in link. No password to remember.
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
            {error && <p className="text-sm text-pink-deep">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send me a sign-in link'}
            </button>
            <p className="text-sm text-muted">
              Use the address the organisers have for you. Check your spam folder if nothing
              arrives within a few minutes.
            </p>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <h2 className="text-xl">Check your inbox</h2>
            <p className="text-muted">
              We have sent a link to <strong className="text-ink">{email}</strong>. Open it on this
              device to continue. The link works once and expires after an hour.
            </p>
            {!isLive && (
              <div className="rounded-xl bg-blush p-5">
                <p className="label-caps text-pink-deep">Prototype shortcut</p>
                <p className="mt-1 text-sm text-muted">
                  No email is sent in prototype mode. Click below to pretend you opened the link.
                </p>
                <button type="button" onClick={() => prototypeSignIn(email.trim())} className="btn-pink mt-4">
                  Open the sign-in link
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
