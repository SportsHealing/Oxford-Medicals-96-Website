import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'

// Shown once, the first time a member signs in: a quick nudge to set a
// password so next time they can skip the emailed code.
export default function PasswordPrompt() {
  const { needsPasswordPrompt, memberId, finishPasswordPrompt } = useAuth()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  if (!needsPasswordPrompt || !memberId) return null

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return setProblem('Use at least 8 characters.')
    if (pw !== pw2) return setProblem('The two passwords do not match.')
    setBusy(true)
    setProblem(await finishPasswordPrompt(pw))
    setBusy(false)
  }

  const skip = async () => {
    setBusy(true)
    setProblem(await finishPasswordPrompt())
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="pw-title">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="ribbon h-1.5" />
        <form onSubmit={(e) => void save(e)} className="space-y-5 p-7 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush">
              <img src={asset('/rita.svg')} alt="" className="h-9 w-9" />
            </span>
            <div>
              <p className="eyebrow">Welcome in</p>
              <h2 id="pw-title" className="text-2xl">Set a password?</h2>
            </div>
          </div>
          <p className="text-muted">
            Next time you can sign in with your email and password, no code needed. You can always use
            a code instead if you forget it.
          </p>
          <label className="block">
            <span className="label-caps">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="field mt-1.5"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="At least 8 characters"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="label-caps">Type it again</span>
            <input
              type="password"
              autoComplete="new-password"
              className="field mt-1.5"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
          </label>
          {problem && <p className="font-sans text-sm text-pink-deep">{problem}</p>}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="submit" className="btn-primary" disabled={busy || !pw}>
              {busy ? 'Saving…' : 'Save password'}
            </button>
            <button type="button" className="btn-quiet" onClick={() => void skip()} disabled={busy}>
              Not now, keep using codes
            </button>
          </div>
          <p className="font-sans text-xs text-muted">You will not see this again. You can set a password any time on your Me page.</p>
        </form>
      </div>
    </div>
  )
}
