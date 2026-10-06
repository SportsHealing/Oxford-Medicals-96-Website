import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

export default function Admin() {
  const { isAdmin, memberId } = useAuth()
  const { data, loading, error, reload } = useLoad(
    async () => {
      const [photos, allowed, members] = await Promise.all([
        repo.listPhotos(),
        repo.listAllowedEmails(),
        repo.adminMembers(),
      ])
      return { photos, allowed, members }
    },
    [],
  )

  if (!isAdmin) return <Navigate to="/photos" replace />
  if (loading) return <Loading what="Loading admin tools" />
  if (error) return <LoadError message={error} />
  if (!data) return null

  // One row per person: everyone invited, plus anyone signed in whose address
  // is no longer on the invite list.
  const memberByEmail = new Map(data.members.map((m) => [m.email.toLowerCase(), m]))
  const people = [
    ...data.allowed.map((a) => ({ email: a.email, note: a.note, member: memberByEmail.get(a.email.toLowerCase()) })),
    ...data.members
      .filter((m) => !data.allowed.some((a) => a.email.toLowerCase() === m.email.toLowerCase()))
      .map((m) => ({ email: m.email, note: null as string | null, member: m })),
  ]

  return (
    <div>
      <PageHeader eyebrow="Organisers only" title="Admin" lede="Upload photos and manage who can sign in." />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card flex flex-col justify-between gap-5 p-6">
          <div>
            <h2 className="text-xl">Add photos</h2>
            <p className="mt-2 font-sans text-sm text-muted">
              Upload up to 20 at a time, then tag the people you know in each one. Members can do this too,
              from the Photos page.
            </p>
          </div>
          <Link to="/photos/new" className="btn-primary self-start">
            + Add photos
          </Link>
        </div>
        <InviteForm onDone={reload} />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl">Members</h2>
        <p className="mt-1 font-sans text-sm text-muted">
          {people.length} on the list, {data.members.length} signed in so far. Admins can upload and delete
          any photo and manage this list.
        </p>
        <ul className="card mt-4 divide-y divide-line">
          {people.map((p) => (
            <li key={p.email} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 font-sans text-sm">
              <span className={`h-2 w-2 shrink-0 rounded-full ${p.member ? 'bg-rose' : 'bg-line'}`} />
              <span className="min-w-0 flex-1">
                {p.member?.name && <span className="block truncate font-semibold text-navy">{p.member.name}</span>}
                <span className="block truncate text-ink">{p.email}</span>
              </span>
              {p.note && <span className="hidden text-muted sm:block">{p.note}</span>}
              {p.member?.isAdmin && (
                <span className="rounded-full bg-rose px-2 py-0.5 text-xs font-semibold text-navy">Admin</span>
              )}
              <span className="text-xs text-muted">{p.member ? 'Signed in' : 'Invited'}</span>
              {p.member && p.member.id !== memberId && (
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-navy hover:border-navy"
                  onClick={() => {
                    const m = p.member!
                    const q = m.isAdmin ? `Remove admin access from ${m.name || m.email}?` : `Make ${m.name || m.email} an admin?`
                    if (confirm(q)) {
                      void repo
                        .setAdmin(m.id, !m.isAdmin)
                        .then(reload, (e: unknown) => alert(e instanceof Error ? e.message : 'Could not change'))
                    }
                  }}
                >
                  {p.member.isAdmin ? 'Remove admin' : 'Make admin'}
                </button>
              )}
              {!p.member && (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-rose-deep"
                  onClick={() => {
                    if (confirm(`Remove ${p.email} from the list?`)) void repo.removeAllowedEmail(p.email).then(reload)
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
          {people.length === 0 && <li className="px-4 py-3 text-muted">Nobody invited yet.</li>}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Photos</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.photos.map((p) => (
            <li key={p.id} className="card overflow-hidden">
              <Link to={`/photos/${p.id}`}>
                <img src={p.src} alt={p.title} className="aspect-[4/3] w-full object-cover" />
              </Link>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate font-sans text-sm text-navy">{p.title}</span>
                <button
                  type="button"
                  className="shrink-0 font-sans text-xs text-muted hover:text-rose-deep"
                  onClick={() => {
                    if (confirm(`Delete "${p.title}"? This removes its tags too.`)) void repo.deletePhoto(p.id).then(reload)
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {data.photos.length === 0 && <li className="text-muted">No photos yet.</li>}
        </ul>
      </section>
    </div>
  )
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const emails = Array.from(
      new Set(
        text
          .split(/[\s,;]+/)
          .map((s) => s.trim().toLowerCase())
          .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)),
      ),
    )
    if (emails.length === 0) {
      setMsg('No valid email addresses found.')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      await repo.addAllowedEmails(emails, note.trim() || undefined)
      setText('')
      setMsg(`Added ${emails.length} address${emails.length === 1 ? '' : 'es'}.`)
      onDone()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not add')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="card space-y-4 p-6">
      <h2 className="text-xl">Invite members</h2>
      <p className="font-sans text-sm text-muted">
        Paste email addresses, one per line or separated by commas. They can then sign in with an emailed code.
        No email is sent by this form; let them know yourself.
      </p>
      <label className="block">
        <span className="label-caps">Email addresses</span>
        <textarea className="field mt-1.5 font-mono text-sm" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label className="block">
        <span className="label-caps">Note (optional, e.g. college)</span>
        <input className="field mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {msg && <p className="font-sans text-sm text-muted">{msg}</p>}
      <button type="submit" className="btn-primary" disabled={busy || !text.trim()}>
        {busy ? 'Adding…' : 'Add to members list'}
      </button>
    </form>
  )
}
