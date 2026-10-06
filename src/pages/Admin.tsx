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

  const joined = new Set(data.members.map((m) => m.email))

  return (
    <div>
      <PageHeader eyebrow="Organisers only" title="Admin" lede="Upload photos and manage who can sign in." />

      <div className="grid gap-8 lg:grid-cols-2">
        <UploadForm onDone={reload} />
        <InviteForm onDone={reload} />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl">Members list</h2>
        <p className="mt-1 font-sans text-sm text-muted">
          {data.allowed.length} invited, {data.members.length} signed in so far.
        </p>
        <ul className="card mt-4 divide-y divide-line">
          {data.allowed.map((a) => (
            <li key={a.email} className="flex items-center gap-3 px-4 py-2.5 font-sans text-sm">
              <span className={`h-2 w-2 shrink-0 rounded-full ${joined.has(a.email) ? 'bg-pink' : 'bg-line'}`} />
              <span className="min-w-0 flex-1 truncate text-ink">{a.email}</span>
              <span className="hidden text-muted sm:block">{a.note}</span>
              <span className="text-xs text-muted">{joined.has(a.email) ? 'Signed in' : 'Invited'}</span>
              {!joined.has(a.email) && (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-pink-deep"
                  onClick={() => {
                    if (confirm(`Remove ${a.email} from the list?`)) void repo.removeAllowedEmail(a.email).then(reload)
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
          {data.allowed.length === 0 && <li className="px-4 py-3 text-muted">Nobody invited yet.</li>}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Who has signed in</h2>
        <p className="mt-1 font-sans text-sm text-muted">
          Admins can upload and delete any photo and manage this list.
        </p>
        <ul className="card mt-4 divide-y divide-line">
          {data.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 font-sans text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-navy">{m.name || 'Name not set yet'}</span>
                <span className="block truncate text-muted">{m.email}</span>
              </span>
              {m.isAdmin && <span className="rounded-full bg-rita px-2 py-0.5 text-xs font-semibold text-navy">Admin</span>}
              {m.id !== memberId && (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-pink-deep"
                  onClick={() => {
                    const verb = m.isAdmin ? 'Remove admin access from' : 'Make admin:'
                    if (confirm(`${verb} ${m.name || m.email}?`)) {
                      void repo.setAdmin(m.id, !m.isAdmin).then(reload, (e: unknown) => alert(e instanceof Error ? e.message : 'Could not change'))
                    }
                  }}
                >
                  {m.isAdmin ? 'Remove admin' : 'Make admin'}
                </button>
              )}
            </li>
          ))}
          {data.members.length === 0 && <li className="px-4 py-3 text-muted">Nobody yet.</li>}
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
                  className="shrink-0 font-sans text-xs text-muted hover:text-pink-deep"
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

function UploadForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [place, setPlace] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setMsg(null)
    try {
      await repo.addPhoto({ file, title: title.trim(), year: year.trim(), place: place.trim(), caption: caption.trim() })
      setFile(null)
      setTitle('')
      setYear('')
      setPlace('')
      setCaption('')
      setMsg('Uploaded.')
      onDone()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="card space-y-4 p-6">
      <h2 className="text-xl">Upload a photo</h2>
      <label className="block">
        <span className="label-caps">Image file</span>
        <input
          type="file"
          accept="image/*"
          required
          className="mt-1.5 block w-full font-sans text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:font-semibold file:text-white"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <label className="block">
        <span className="label-caps">Title</span>
        <input className="field mt-1.5" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tingewick 1995" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label-caps">Year</span>
          <input className="field mt-1.5" value={year} onChange={(e) => setYear(e.target.value)} placeholder="1995" />
        </label>
        <label className="block">
          <span className="label-caps">Place</span>
          <input className="field mt-1.5" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Osler House" />
        </label>
      </div>
      <label className="block">
        <span className="label-caps">Caption (optional)</span>
        <textarea className="field mt-1.5" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />
      </label>
      {msg && <p className="font-sans text-sm text-muted">{msg}</p>}
      <button type="submit" className="btn-primary" disabled={busy || !file || !title.trim()}>
        {busy ? 'Uploading…' : 'Upload'}
      </button>
    </form>
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
        Paste email addresses, one per line or separated by commas. They can then sign in with a link.
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
