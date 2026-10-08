import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'
import { isLive } from '../lib/supabase.ts'

// Supabase sends 8-digit codes for this project.
const CODE_DIGITS = 8

type Mode = 'signin' | 'join'
type Step = 'form' | 'code' | 'pending' | 'declined'

export default function SignIn() {
  const { email: signedInAs, requestLink, verifyCode, signInWithPassword, setPassword, claimAccess, prototypeSignIn, signOut } =
    useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Invitation emails link here with the address filled in.
  const invited = params.get('email')
  const [mode, setMode] = useState<Mode>(invited ? 'join' : 'signin')
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState(invited ?? '')
  const [name, setName] = useState('')
  const [previousName, setPreviousName] = useState('')
  const [password, setPw] = useState('')
  const [password2, setPw2] = useState('')
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/photos'
  // While joining, the person is signed in before they are a member: stay here.
  const midJoin = mode === 'join' && step !== 'form'
  if (signedInAs && !midJoin) return <Navigate to={from} replace />

  const cleanEmail = email.trim().toLowerCase()
  const digits = code.replace(/\D/g, '')

  const switchMode = (m: Mode) => {
    setMode(m)
    setStep('form')
    setError(null)
    setCode('')
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  const sendCode = (e?: FormEvent) => {
    e?.preventDefault()
    if (!cleanEmail) return
    if (mode === 'join' && !name.trim()) return setError('Please enter your name.')
    void run(async () => {
      const problem = await requestLink(cleanEmail)
      if (problem) setError(problem)
      else setStep('code')
    })
  }

  const withPassword = (e: FormEvent) => {
    e.preventDefault()
    if (!cleanEmail || !password) return
    void run(async () => {
      const problem = await signInWithPassword(cleanEmail, password)
      if (problem) setError(problem)
      else navigate(from, { replace: true })
    })
  }

  const signInWithCode = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const problem = await verifyCode(cleanEmail, code)
      if (problem) setError(problem)
      else navigate(from, { replace: true })
    })
  }

  const createAccount = (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return setError('Choose a password of at least 8 characters.')
    if (password !== password2) return setError('The two passwords do not match.')
    void run(async () => {
      if (!verified) {
        const problem = await verifyCode(cleanEmail, code)
        if (problem) return setError(problem)
        setVerified(true)
      }
      const pwProblem = await setPassword(password)
      if (pwProblem) return setError(`Your email is confirmed, but the password was not saved: ${pwProblem}`)
      const result = await claimAccess(name, previousName, cleanEmail)
      if ('error' in result) return setError(result.error)
      if (result.status === 'member' || result.status === 'joined_by_name') navigate('/photos', { replace: true })
      else setStep(result.status)
    })
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card overflow-hidden">
        <div className="h-1 bg-rose" />
        <div className="p-7 sm:p-10">
          <img src={asset('/rita.svg')} alt="" className="h-12 w-12" />

          {step === 'form' && (
            <div role="tablist" aria-label="Sign in or join" className="mt-5 grid grid-cols-2 rounded-full bg-paper p-1 font-sans text-sm font-semibold">
              {(['signin', 'join'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`rounded-full px-3 py-2 transition ${mode === m ? 'bg-white text-navy shadow-card' : 'text-muted hover:text-navy'}`}
                >
                  {m === 'signin' ? 'Sign in' : 'First time here?'}
                </button>
              ))}
            </div>
          )}

          {mode === 'signin' && step === 'form' && (
            <form onSubmit={withPassword} className="mt-6 space-y-5">
              <h1 className="text-3xl">Welcome back</h1>
              <Field label="Email">
                <input type="email" required autoComplete="email" className="field mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Field label="Password">
                <input type="password" required autoComplete="current-password" className="field mt-1.5" value={password} onChange={(e) => setPw(e.target.value)} />
              </Field>
              <Problem text={error} />
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'One moment…' : 'Sign in'}
              </button>
              <p className="font-sans text-sm text-muted">
                No password yet, or forgotten it?{' '}
                <button type="button" className="font-semibold text-navy underline-offset-2 hover:underline" disabled={busy || !cleanEmail} onClick={() => sendCode()}>
                  Email me a code instead
                </button>
                {!cleanEmail && ' (enter your email first)'}
              </p>
            </form>
          )}

          {mode === 'join' && step === 'form' && (
            <form onSubmit={sendCode} className="mt-6 space-y-5">
              <h1 className="text-3xl">Join Oxford Medics 96</h1>
              <p className="text-muted">
                For the Oxford medical class of 1996. If you are on our list you can create your account straight
                away. If not, we will ask the organisers.
              </p>
              <Field label="Your name">
                <input required autoComplete="name" className="field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="As you would like it shown" />
              </Field>
              <Field label="Name at medical school, if different (optional)">
                <input className="field mt-1.5" value={previousName} onChange={(e) => setPreviousName(e.target.value)} placeholder="For example a maiden name" />
              </Field>
              <Field label="Email">
                <input type="email" required autoComplete="email" className="field mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Problem text={error} />
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'One moment…' : 'Continue'}
              </button>
              <p className="font-sans text-sm text-muted">Next we email you a code to check the address is yours.</p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={mode === 'join' ? createAccount : signInWithCode} className="mt-6 space-y-5">
              <h1 className="text-2xl">Check your inbox</h1>
              <p className="text-muted">
                We have emailed an {CODE_DIGITS}-digit code to <strong className="text-ink">{cleanEmail}</strong>. It
                works for one hour. If it is not there, look in junk or spam.
              </p>
              <Field label="Code from the email">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]*"
                  maxLength={12}
                  required={!verified}
                  disabled={verified}
                  className="field mt-1.5 text-center font-mono text-2xl tracking-[0.3em]"
                  value={verified ? '✓ confirmed' : code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={'0'.repeat(CODE_DIGITS)}
                  autoFocus
                />
              </Field>
              {mode === 'join' && (
                <>
                  <Field label="Choose a password">
                    <input type="password" autoComplete="new-password" className="field mt-1.5" value={password} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
                  </Field>
                  <Field label="Type it again">
                    <input type="password" autoComplete="new-password" className="field mt-1.5" value={password2} onChange={(e) => setPw2(e.target.value)} />
                  </Field>
                </>
              )}
              <Problem text={error} />
              <button type="submit" className="btn-primary w-full" disabled={busy || (!verified && digits.length < 6)}>
                {busy ? 'One moment…' : mode === 'join' ? 'Create my account' : 'Sign in'}
              </button>
              {!verified && (
                <div className="flex justify-between font-sans text-sm text-muted">
                  <button type="button" className="hover:text-navy" onClick={() => switchMode(mode)}>
                    Use a different email
                  </button>
                  <button type="button" className="hover:text-navy" disabled={busy} onClick={() => sendCode()}>
                    Send a new code
                  </button>
                </div>
              )}
              {!isLive && mode === 'signin' && (
                <div className="rounded-xl bg-rose-soft p-5">
                  <p className="label-caps text-rose-deep">Prototype shortcut</p>
                  <p className="mt-1 text-sm text-muted">No email is sent in prototype mode.</p>
                  <button type="button" onClick={() => prototypeSignIn(cleanEmail)} className="btn-pink mt-4">
                    Pretend the code was right
                  </button>
                </div>
              )}
            </form>
          )}

          {step === 'pending' && (
            <Outcome title="Request sent">
              <p>
                Thank you, {name.trim().split(' ')[0] || 'and welcome'}. We could not find you on our list, so we have
                asked the organisers. They will email <strong className="text-ink">{cleanEmail}</strong> when they have
                decided.
              </p>
              <p>Your password is saved. Once you are accepted, just sign in with your email and password.</p>
            </Outcome>
          )}

          {step === 'declined' && (
            <Outcome title="We could not add you">
              <p>
                The organisers were not able to confirm you as a member of the Oxford medical class of 1996. If you
                think this is a mistake, reply to the email they sent you.
              </p>
            </Outcome>
          )}

          {(step === 'pending' || step === 'declined') && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/" className="btn-primary" onClick={() => void signOut()}>
                Back to the home page
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label-caps">{label}</span>
      {children}
    </label>
  )
}

function Problem({ text }: { text: string | null }) {
  return text ? (
    <p role="alert" className="font-sans text-sm text-rose-deep">
      {text}
    </p>
  ) : null
}

function Outcome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 space-y-3 text-muted">
      <h1 className="text-3xl text-navy">{title}</h1>
      {children}
    </div>
  )
}
