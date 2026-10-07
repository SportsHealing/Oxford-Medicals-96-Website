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
    ...data.allowed.map((a) => ({
      email: a.email,
      note: a.note,
      inviteSentAt: a.inviteSentAt,
      member: memberByEmail.get(a.email.toLowerCase()),
    })),
    ...data.members
      .filter((m) => !data.allowed.some((a) => a.email.toLowerCase() === m.email.toLowerCase()))
      .map((m) => ({ email: m.email, note: null as string | null, inviteSentAt: null as string | null, member: m })),
  ]

  return (
    <div>
      <PageHeader eyebrow="Organisers only" title="Admin" lede="Upload photos and manage who can sign in." />

      <div className="grid items-start gap-8 lg:grid-cols-2">
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
              <span className="text-xs text-muted">
                {p.member
                  ? 'Signed in'
                  : p.inviteSentAt
                    ? `Email sent ${new Date(p.inviteSentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                    : 'On list, not emailed'}
              </span>
              {!p.member && (
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-navy hover:border-navy"
                  onClick={() => {
                    void repo
                      .sendInvites({ emails: [p.email] })
                      .then(reload, (e: unknown) => alert(e instanceof Error ? e.message : 'Could not send'))
                  }}
                >
                  {p.inviteSentAt ? 'Resend' : 'Send invite'}
                </button>
              )}
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
                <img src={p.src} alt={p.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
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
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const emails = Array.from(
    new Set(
      text
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)),
    ),
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (emails.length === 0) {
      setMsg('No valid email addresses found.')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const r = await repo.sendInvites({ emails, note: note.trim() || undefined, message: message.trim() || undefined })
      setText('')
      setMsg(
        r.failed.length
          ? `Added ${r.added}. Sent ${r.sent}. Could not email ${r.failed.length}: ${r.failed[0].reason}`
          : `Done. ${r.sent} invitation${r.sent === 1 ? '' : 's'} sent.`,
      )
      onDone()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not send')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="card space-y-4 p-6">
      <h2 className="text-xl">Invite members</h2>
      <p className="font-sans text-sm text-muted">
        Paste email addresses, one per line or separated by commas. Each person gets their own email with a
        button to join. Replies come back to you.
      </p>
      <label className="block">
        <span className="label-caps">Email addresses</span>
        <textarea className="field mt-1.5 font-mono text-sm" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label className="block">
        <span className="label-caps">Personal message (optional, goes in the email)</span>
        <textarea
          className="field mt-1.5"
          rows={3}
          maxLength={1500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hope you're well. We've put all the old photos in one place..."
        />
      </label>
      <label className="block">
        <span className="label-caps">Note for admins (optional, e.g. college)</span>
        <input className="field mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {msg && <p className="font-sans text-sm text-muted">{msg}</p>}
      <button type="submit" className="btn-primary" disabled={busy || emails.length === 0}>
        {busy ? 'Sending…' : emails.length ? `Send ${emails.length} invitation${emails.length === 1 ? '' : 's'}` : 'Send invitations'}
      </button>
    </form>
  )
}
