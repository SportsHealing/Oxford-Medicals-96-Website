import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/photos'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSent(true)
  }

  const pretendClickLink = () => {
    signIn(email.trim())
    navigate(from, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8 sm:p-10">
        <img src={asset('/rita.svg')} alt="" className="h-12 w-12" />
        <h1 className="mt-5 text-3xl">Member sign in</h1>

        {!sent ? (
          <form onSubmit={submit} className="mt-6 space-y-5">
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
            <button type="submit" className="btn-primary w-full">
              Send me a sign-in link
            </button>
            <p className="text-sm text-muted">
              Only addresses on the members list receive a link.
            </p>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <h2 className="text-xl">Check your inbox</h2>
            <p className="text-muted">
              We have sent a link to <strong className="text-ink">{email}</strong>. Open it on this
              device to continue.
            </p>
            <div className="rounded-xl bg-blush p-5">
              <p className="label-caps text-pink-deep">Prototype shortcut</p>
              <p className="mt-1 text-sm text-muted">
                No email is sent yet. Click below to pretend you opened the link.
              </p>
              <button type="button" onClick={pretendClickLink} className="btn-pink mt-4">
                Open the sign-in link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
