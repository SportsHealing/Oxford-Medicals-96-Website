import { useState, type FormEvent } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAccess } from '../access.tsx'
import { asset } from '../asset.ts'

// Wraps the pages behind the class code. Until the code has been entered on
// this device, the page shows the code prompt instead.
export default function CodeGate() {
  const { status } = useAccess()
  if (status === 'checking') return <p className="py-20 text-center text-muted">One moment&hellip;</p>
  if (status === 'locked') return <CodePrompt />
  return <Outlet />
}

export function CodePrompt() {
  const { unlock } = useAccess()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setProblem(null)
    const msg = await unlock(code)
    if (msg) {
      setProblem(msg)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft">
          <img src={asset('/rita.svg')} alt="" className="h-9 w-9" />
        </span>
        <p className="eyebrow mt-5 mb-2">Class of 1996</p>
        <h1 className="text-3xl">Enter the class code</h1>
        <p className="mt-2 text-muted">
          The photos and speeches are for our year group. Type the 8-digit code that was shared with the class.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="label-caps">Code</span>
            <input
              className="field mt-1 text-center font-sans text-2xl tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="12345678"
              aria-label="8-digit class code"
            />
          </label>
          {problem && (
            <p className="font-sans text-sm text-rose-deep" role="alert">
              {problem}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy || code.length < 8}>
            {busy ? 'Checking…' : 'Open the photos'}
          </button>
        </form>
        <p className="mt-5 font-sans text-sm text-muted">
          Don&rsquo;t have the code? Ask one of the organisers or a classmate. The code is remembered on this device until you press{' '}
          <strong>Lock</strong> at the bottom of any page.
        </p>
      </div>
      <p className="mt-4 text-center font-sans text-sm text-muted">
        <Link to="/privacy">How your photos are protected</Link>
      </p>
    </div>
  )
}
