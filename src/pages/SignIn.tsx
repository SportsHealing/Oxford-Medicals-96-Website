import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.tsx'

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
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-4xl">Member sign in</h1>

      {!sent ? (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-gray-700">
            Enter your email. We will send you a sign-in link. No password to remember.
          </p>
          <label className="block">
            <span className="font-sans font-semibold text-navy">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="field mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button type="submit" className="btn-primary w-full">
            Send me a sign-in link
          </button>
          <p className="text-sm text-gray-600">
            Only email addresses on the members list will receive a link.
          </p>
        </form>
      ) : (
        <div className="space-y-4 rounded-xl bg-blush p-6">
          <h2 className="text-2xl">Check your inbox</h2>
          <p className="text-gray-700">
            We have sent a sign-in link to <strong>{email}</strong>. Open it on this device to
            continue.
          </p>
          <div className="rounded-md border border-dashed border-pink-deep bg-white p-4 text-sm">
            <p className="font-sans font-semibold text-navy">Prototype shortcut</p>
            <p className="mt-1 text-gray-700">
              No email is sent in this prototype. Click below to pretend you opened the link.
            </p>
            <button type="button" onClick={pretendClickLink} className="btn-pink mt-3">
              Open the sign-in link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
