import { useState, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import Avatar from '../components/Avatar.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'
import NotFound from './NotFound.tsx'

export default function PhotoView() {
  const { id = '' } = useParams()
  const { memberId } = useAuth()
  const { data, loading, error, reload } = useLoad(
    async () => {
      const [photo, members, all] = await Promise.all([repo.getPhoto(id), repo.listMembers(), repo.listPhotos()])
      return { photo, members, all }
    },
    [id],
  )
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [choice, setChoice] = useState('')
  const [showLabels, setShowLabels] = useState(true)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  if (loading) return <Loading what="Opening the photo" />
  if (error) return <LoadError message={error} />
  if (!data?.photo) return <NotFound />
  const { photo, members, all } = data

  const index = all.findIndex((p) => p.id === photo.id)
  const prev = all[index - 1]
  const next = all[index + 1]
  const memberById = new Map(members.map((m) => [m.id, m]))
  const visibleTags = photo.tags.filter((t) => t.status !== 'rejected')

  const placeTag = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setDraft({ x, y })
    setChoice('')
    setProblem(null)
  }

  const saveTag = async () => {
    if (!draft || !choice) return
    setBusy(true)
    setProblem(null)
    try {
      await repo.suggestTag(photo.id, choice, draft.x, draft.y)
      setDraft(null)
      setChoice('')
      reload()
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Could not save the tag')
    } finally {
      setBusy(false)
    }
  }

  const decide = async (tagId: string, status: 'confirmed' | 'rejected') => {
    setBusy(true)
    try {
      await repo.decideTag(tagId, status)
      reload()
    } finally {
      setBusy(false)
    }
  }

  const untagged = members.filter((m) => m.allowsTags && !visibleTags.some((t) => t.memberId === m.id))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/photos" className="font-sans text-sm text-muted no-underline hover:text-navy">
          &larr; All photos
        </Link>
        <div className="flex gap-2">
          <PagerLink to={prev ? `/photos/${prev.id}` : undefined} label="Previous" />
          <PagerLink to={next ? `/photos/${next.id}` : undefined} label="Next" />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div
            className="card relative cursor-crosshair overflow-hidden bg-paper"
            onClick={placeTag}
            title="Click on a face to add a name"
          >
            <img src={photo.src} alt={photo.title} className="block w-full" />
            {showLabels &&
              visibleTags.map((tag) => {
                const person = memberById.get(tag.memberId)
                return (
                  <span
                    key={tag.id}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/95 py-1 pr-2.5 pl-1.5 font-sans text-xs font-semibold text-navy shadow-card ${
                      tag.status === 'pending' ? 'ring-1 ring-navy/30 ring-inset' : ''
                    }`}
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                  >
                    <span className={`h-2 w-2 rounded-full ${tag.status === 'confirmed' ? 'bg-pink' : 'bg-navy/30'}`} />
                    {person?.knownAs ?? person?.name ?? 'Unknown'}
                  </span>
                )
              })}
            {draft && (
              <span
                className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pink shadow-card"
                style={{ left: `${draft.x}%`, top: `${draft.y}%` }}
              />
            )}
          </div>
          <div className="mt-3 flex items-center justify-between font-sans text-sm text-muted">
            <span>Click on a face to add a name.</span>
            <button type="button" className="hover:text-navy" onClick={() => setShowLabels((v) => !v)}>
              {showLabels ? 'Hide names' : 'Show names'}
            </button>
          </div>
        </div>

        <aside className="space-y-8">
          <div>
            <p className="label-caps">{[photo.year, photo.place].filter(Boolean).join(' · ') || 'Undated'}</p>
            <h1 className="mt-1 text-3xl">{photo.title}</h1>
            {photo.caption && <p className="mt-3 text-muted">{photo.caption}</p>}
          </div>

          {draft && (
            <div className="card space-y-4 border-pink/50 p-5">
              <h2 className="text-lg">Who is this?</h2>
              <select className="field" value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">Choose a classmate</option>
                {untagged.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.college ? ` (${m.college})` : ''}
                  </option>
                ))}
              </select>
              <p className="font-sans text-sm text-muted">
                They will be asked to confirm before the tag is shown to anyone else.
              </p>
              {problem && <p className="font-sans text-sm text-pink-deep">{problem}</p>}
              <div className="flex gap-2">
                <button type="button" className="btn-primary" onClick={() => void saveTag()} disabled={!choice || busy}>
                  Suggest tag
                </button>
                <button type="button" className="btn-quiet" onClick={() => setDraft(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div>
            <h2 className="label-caps mb-3 text-navy">In this photo</h2>
            <ul className="card divide-y divide-line">
              {visibleTags.map((tag) => {
                const person = memberById.get(tag.memberId)
                if (!person) return null
                const isMe = tag.memberId === memberId
                return (
                  <li key={tag.id} className="flex items-center gap-3 px-4 py-3">
                    <Link to={`/classmates/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3 no-underline">
                      <Avatar name={person.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-sans font-semibold text-navy">{person.name}</span>
                        <span className="block truncate font-sans text-sm text-muted">{person.jobTitle}</span>
                      </span>
                    </Link>
                    {tag.status === 'pending' && isMe ? (
                      <span className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-full bg-navy px-3 py-1 font-sans text-xs font-semibold text-white"
                          onClick={() => void decide(tag.id, 'confirmed')}
                          disabled={busy}
                        >
                          That&rsquo;s me
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-muted"
                          onClick={() => void decide(tag.id, 'rejected')}
                          disabled={busy}
                        >
                          Not me
                        </button>
                      </span>
                    ) : tag.status === 'pending' ? (
                      <span className="rounded-full bg-paper px-2 py-0.5 font-sans text-[0.7rem] font-semibold text-muted">
                        To confirm
                      </span>
                    ) : null}
                  </li>
                )
              })}
              {visibleTags.length === 0 && <li className="px-4 py-3 text-muted">No one named yet.</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PagerLink({ to, label }: { to?: string; label: string }) {
  const cls = 'rounded-full border px-4 py-1.5 font-sans text-sm font-semibold no-underline transition'
  if (!to) return <span className={`${cls} border-line text-muted/50`}>{label}</span>
  return (
    <Link to={to} className={`${cls} border-line bg-white text-navy hover:border-navy`}>
      {label}
    </Link>
  )
}
