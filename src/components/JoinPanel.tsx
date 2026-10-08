import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth.tsx'

// Shown to someone who is signed in but not (yet) a member: lets them check
// in by name, or shows how their request to join is going.
export default function JoinPanel() {
  const { email, claimAccess, myJoinStatus, signOut } = useAuth()
  const [status, setStatus] = useState<'loading' | 'none' | 'pending' | 'declined'>('loading')
  const [name, setName] = useState('')
  const [previousName, setPreviousName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    myJoinStatus()
      .catch(() => null)
      .then((s) => {
        if (live) setStatus(s === 'pending' || s === 'declined' ? s : 'none')
      })
    return () => {
      live = false
    }
  }, [myJoinStatus])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    const r = await claimAccess(name, previousName, email ?? undefined)
    setBusy(false)
    if ('error' in r) setError(r.error)
    else if (r.status === 'pending' || r.status === 'declined') setStatus(r.status)
    // A member is let in by the membership refresh; nothing more to do here.
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="card p-7 sm:p-9">
        {status === 'loading' && <p className="text-muted">Checking&hellip;</p>}

        {status === 'none' && (
          <form onSubmit={(e) => void submit(e)} className="space-y-5">
            <p className="eyebrow">Almost there</p>
            <h1 className="text-3xl">Tell us who you are</h1>
            <p className="text-muted">
              You are signed in as <strong className="text-ink">{email}</strong>, but that address is not on our
              list yet. Give us your name and we will check the class list, or pass your request to the organisers.
            </p>
            <label className="block">
              <span className="label-caps">Your name</span>
              <input required autoComplete="name" className="field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="label-caps">Name at medical school, if different (optional)</span>
              <input className="field mt-1.5" value={previousName} onChange={(e) => setPreviousName(e.target.value)} />
            </label>
            {error && <p role="alert" className="font-sans text-sm text-rose-deep">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Checking…' : 'Continue'}
            </button>
          </form>
        )}

        {status === 'pending' && (
          <div className="space-y-3">
            <p className="eyebrow">Request sent</p>
            <h1 className="text-3xl">Waiting for the organisers</h1>
            <p className="text-muted">
              We have asked the organisers to confirm you. They will email <strong className="text-ink">{email}</strong>{' '}
              when they have decided. You can close this page.
            </p>
          </div>
        )}

        {status === 'declined' && (
          <div className="space-y-3">
            <h1 className="text-3xl">We could not add you</h1>
            <p className="text-muted">
              The organisers were not able to confirm you as a member of the class of 1996. If you think this is a
              mistake, reply to the email they sent you.
            </p>
          </div>
        )}

        {status !== 'loading' && (
          <button type="button" className="btn-outline mt-6" onClick={() => void signOut()}>
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}
