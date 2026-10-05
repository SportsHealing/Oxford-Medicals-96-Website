import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import Avatar from '../components/Avatar.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { repo } from '../data/repo.ts'
import type { Member, ProfileInput } from '../data/types.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

function toInput(m: Member): ProfileInput {
  return {
    name: m.name === 'Unnamed member' ? '' : m.name,
    knownAs: m.knownAs ?? '',
    college: m.college ?? '',
    jobTitle: m.jobTitle ?? '',
    workplace: m.workplace ?? '',
    careerPath: m.careerPath ?? '',
    interests: m.interests ?? '',
    clinicalTraining: m.clinicalTraining ?? '',
    memory: m.memory ?? '',
    tingewick: m.tingewick ?? '',
    linkedin: m.linkedin ?? '',
    acceptsContact: m.acceptsContact,
    allowsTags: m.allowsTags,
  }
}

type Loaded = {
  me: Member
  pending: Awaited<ReturnType<typeof repo.myPendingTags>>
  inbox: Awaited<ReturnType<typeof repo.inbox>>
  email: string | null
}

export default function Me() {
  const { memberId } = useAuth()
  const { data, loading, error, reload } = useLoad(
    async (): Promise<Loaded | null> => {
      if (!memberId) return null
      const [me, pending, inbox, email] = await Promise.all([
        repo.getMember(memberId),
        repo.myPendingTags(),
        repo.inbox(),
        repo.myEmail(),
      ])
      return me ? { me, pending, inbox, email } : null
    },
    [memberId],
  )

  if (loading) return <Loading what="Loading your page" />
  if (error) return <LoadError message={error} />
  if (!data || !memberId) return <LoadError message="We could not find your member record." />
  // Keyed on the member so the form state initialises from loaded data.
  return <MePage key={memberId} memberId={memberId} data={data} reload={reload} />
}

function MePage({ memberId, data, reload }: { memberId: string; data: Loaded; reload: () => void }) {
  const { refresh, setPassword } = useAuth()
  const [pw, setPw] = useState('')
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileInput>(() => toInput(data.me))
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const set = (k: keyof ProfileInput) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setProblem(null)
    setSaved(false)
    try {
      const trimmed = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v]),
      ) as unknown as ProfileInput
      await repo.updateProfile({ ...trimmed, name: form.name.trim() })
      setSaved(true)
      await refresh()
      reload()
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const decide = async (tagId: string, status: 'confirmed' | 'rejected') => {
    await repo.decideTag(tagId, status)
    reload()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your page"
        title={form.name || 'Welcome'}
        lede={data.email ? `Signed in as ${data.email}.` : undefined}
        actions={
          <Link to={`/classmates/${memberId}`} className="btn-outline">
            View my public profile
          </Link>
        }
      />

      {data.pending.length > 0 && (
        <section className="card mb-8 border-pink/50 p-6">
          <p className="eyebrow">Is this you?</p>
          <p className="mt-1 text-muted">
            A classmate thinks you are in {data.pending.length === 1 ? 'this photo' : 'these photos'}. Nobody
            else sees the tag until you confirm it.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.pending.map(({ tag, photo }) => (
              <li key={tag.id} className="flex gap-4 rounded-xl border border-line p-3">
                <Link to={`/photos/${photo.id}`} className="shrink-0">
                  <img src={photo.src} alt={photo.title} className="h-20 w-28 rounded-lg object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-navy">{photo.title}</p>
                  <p className="font-sans text-sm text-muted">{photo.year}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="btn-primary !px-3 !py-1 text-xs" onClick={() => void decide(tag.id, 'confirmed')}>
                      That&rsquo;s me
                    </button>
                    <button type="button" className="btn-outline !px-3 !py-1 text-xs" onClick={() => void decide(tag.id, 'rejected')}>
                      Not me
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={(e) => void save(e)} className="card space-y-8 p-7">
          <section className="space-y-4">
            <p className="eyebrow">About you</p>
            <Field label="Full name" required value={form.name} onChange={set('name')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Known as (optional)" value={form.knownAs ?? ''} onChange={set('knownAs')} placeholder="e.g. Sam" />
              <Field label="College" value={form.college ?? ''} onChange={set('college')} placeholder="e.g. Balliol" />
            </div>
          </section>

          <section className="space-y-4">
            <p className="eyebrow">Now</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Job title and specialty" value={form.jobTitle ?? ''} onChange={set('jobTitle')} />
              <Field label="Where you work" value={form.workplace ?? ''} onChange={set('workplace')} />
            </div>
            <Area label="Your career since Oxford, in a few lines" value={form.careerPath ?? ''} onChange={set('careerPath')} />
            <Field label="Interests outside medicine" value={form.interests ?? ''} onChange={set('interests')} />
            <Field label="LinkedIn link (optional)" value={form.linkedin ?? ''} onChange={set('linkedin')} placeholder="https://www.linkedin.com/in/…" type="url" />
          </section>

          <section className="space-y-4">
            <p className="eyebrow">Then</p>
            <Field label="Where you did your clinical training" value={form.clinicalTraining ?? ''} onChange={set('clinicalTraining')} />
            <Area label="A favourite memory from Oxford" value={form.memory ?? ''} onChange={set('memory')} />
            <Field label="Tingewick: were you involved, and how?" value={form.tingewick ?? ''} onChange={set('tingewick')} />
          </section>

          <section className="space-y-3">
            <p className="eyebrow">Privacy</p>
            <Toggle
              label="Classmates can send me messages"
              hint="They see your email only if you reply."
              checked={form.acceptsContact}
              onChange={(v) => setForm((f) => ({ ...f, acceptsContact: v }))}
            />
            <Toggle
              label="Classmates can tag me in photos"
              hint="Tags are shown to others only after you confirm them."
              checked={form.allowsTags}
              onChange={(v) => setForm((f) => ({ ...f, allowsTags: v }))}
            />
          </section>

          {problem && <p className="font-sans text-sm text-pink-deep">{problem}</p>}
          <div className="flex items-center gap-4">
            <button type="submit" className="btn-primary" disabled={busy || !form.name.trim()}>
              {busy ? 'Saving…' : 'Save profile'}
            </button>
            {saved && <span className="font-sans text-sm text-muted">Saved.</span>}
          </div>
        </form>

        <aside className="space-y-8">
          <section className="card p-5">
            <h2 className="text-lg">Sign in faster</h2>
            <p className="mt-1 font-sans text-sm text-muted">
              Set a password and you can skip the emailed code next time. At least 8 characters.
            </p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                setPwMsg(null)
                void setPassword(pw).then((problem) => {
                  setPwMsg(problem ?? 'Password saved.')
                  if (!problem) setPw('')
                })
              }}
            >
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="field"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="New password"
              />
              <button type="submit" className="btn-outline shrink-0" disabled={pw.length < 8}>
                Save
              </button>
            </form>
            {pwMsg && <p className="mt-2 font-sans text-sm text-muted">{pwMsg}</p>}
          </section>

          <div>
          <h2 className="label-caps mb-3 text-navy">Messages to you</h2>
          {data.inbox.length === 0 ? (
            <p className="card p-5 text-muted">No messages yet.</p>
          ) : (
            <ul className="card divide-y divide-line">
              {data.inbox.map((m) => (
                <li key={m.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.fromName} size="sm" />
                    <div className="min-w-0">
                      <p className="font-sans font-semibold text-navy">{m.fromName}</p>
                      <p className="truncate font-sans text-xs text-muted">{new Date(m.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-ink">{m.message}</p>
                  <a href={`mailto:${m.fromEmail}`} className="mt-3 inline-block font-sans text-sm">
                    Reply by email
                  </a>
                </li>
              ))}
            </ul>
          )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (e: { target: { value: string } }) => void
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <label className="block">
      <span className="label-caps">{label}</span>
      <input className="field mt-1.5" type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} />
    </label>
  )
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (e: { target: { value: string } }) => void }) {
  return (
    <label className="block">
      <span className="label-caps">{label}</span>
      <textarea className="field mt-1.5" rows={3} value={value} onChange={onChange} />
    </label>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-navy" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block font-sans font-semibold text-navy">{label}</span>
        <span className="block font-sans text-sm text-muted">{hint}</span>
      </span>
    </label>
  )
}
