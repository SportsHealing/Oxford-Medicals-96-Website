import { useState, type MouseEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import Avatar from '../components/Avatar.tsx'
import PhotoLightbox from '../components/PhotoLightbox.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'
import NotFound from './NotFound.tsx'

export default function PhotoView() {
  const { id = '' } = useParams()
  const { memberId, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isNew = params.get('new') === '1'
  const queue = (params.get('queue') ?? '').split(',').filter(Boolean)
  const { data, loading, error, reload } = useLoad(
    async () => {
      const [photo, members, all, featured] = await Promise.all([
        repo.getPhoto(id),
        repo.listMembers(),
        repo.listPhotos(),
        isAdmin ? repo.listFeaturedPhotos().catch(() => []) : Promise.resolve([]),
      ])
      return { photo, members, all, featured: featured.map((p) => p.id) }
    },
    [id],
  )
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [choice, setChoice] = useState('')
  const [showLabels, setShowLabels] = useState(true)
  const [full, setFull] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  if (loading) return <Loading what="Opening the photo" />
  if (error) return <LoadError message={error} />
  if (!data?.photo) return <NotFound />
  const { photo, members, all, featured } = data
  const featuredAt = featured.indexOf(photo.id)
  const toggleFeatured = async () => {
    setProblem(null)
    if (featuredAt < 0 && featured.length >= 5) {
      setProblem('Home already shows 5 photos. Remove one first (open it and press Remove from Home).')
      return
    }
    try {
      if (featuredAt >= 0) {
        await repo.setFeatured(photo.id, null)
        // Close the gap so the remaining photos keep their order.
        await Promise.all(featured.slice(featuredAt + 1).map((pid, i) => repo.setFeatured(pid, featuredAt + i + 1)))
      } else {
        await repo.setFeatured(photo.id, featured.length + 1)
      }
      reload()
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Could not change the Home photos')
    }
  }

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

  const canDelete = isAdmin || (memberId !== null && photo.uploadedBy === memberId)
  const deletePhoto = async () => {
    if (!confirm(`Delete "${photo.title}"? This removes its tags too.`)) return
    await repo.deletePhoto(photo.id)
    navigate('/photos')
  }

  const nextInQueue = () => {
    const [nextId, ...rest] = queue
    if (!nextId) {
      navigate(`/photos/${photo.id}`)
      return
    }
    const q = new URLSearchParams({ new: '1' })
    if (rest.length) q.set('queue', rest.join(','))
    setDraft(null)
    navigate(`/photos/${nextId}?${q.toString()}`)
  }

  const untagged = members.filter((m) => m.allowsTags && !visibleTags.some((t) => t.memberId === m.id))

  return (
    <div>
      {isNew && (
        <div className="card mb-6 flex flex-wrap items-center gap-4 border-rose/60 bg-rose-soft/70 p-5">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Uploaded</p>
            <p className="mt-1 text-ink">
              Now tag the people you know: click on a face, then choose who it is.
              {queue.length > 0 && ` ${queue.length} more photo${queue.length === 1 ? '' : 's'} to go.`}
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={nextInQueue}>
            {queue.length > 0 ? 'Next photo →' : 'Done'}
          </button>
        </div>
      )}

      <div className="mb-6">
        <Link to="/photos" className="font-sans text-sm text-muted no-underline hover:text-navy">
          &larr; All photos
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="card flex items-center justify-center overflow-hidden bg-paper lg:h-[60vh]">
            <div
              className="relative inline-block max-w-full cursor-crosshair"
              onClick={placeTag}
              title="Click on a face to add a name"
            >
              <img src={photo.src} alt={photo.title} className="block max-h-[60vh] w-auto max-w-full" />
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
                      <span className={`h-2 w-2 rounded-full ${tag.status === 'confirmed' ? 'bg-rose' : 'bg-navy/30'}`} />
                      {person?.knownAs ?? person?.name ?? 'Unknown'}
                    </span>
                  )
                })}
              {draft && (
                <span
                  className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose shadow-card"
                  style={{ left: `${draft.x}%`, top: `${draft.y}%` }}
                />
              )}
          
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFull(true)
                }}
                className="absolute top-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-navy/85 px-4 py-2 font-sans text-sm font-semibold text-white shadow-card backdrop-blur transition hover:bg-navy"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
                Full screen
              </button>
            </div>
          </div>
          <nav className="mt-4 flex items-center justify-center gap-4" aria-label="Photo navigation">
            <PagerLink to={prev ? `/photos/${prev.id}` : undefined} label="Previous" dir="prev" />
            <span className="min-w-[5.5rem] text-center font-sans text-sm text-muted">
              {index + 1} of {all.length}
            </span>
            <PagerLink to={next ? `/photos/${next.id}` : undefined} label="Next" dir="next" />
          </nav>
          <div className="mt-4 flex items-center justify-between font-sans text-sm text-muted">
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
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {isAdmin && (
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 font-sans text-xs font-semibold transition ${
                    featuredAt >= 0 ? 'bg-rose text-navy hover:bg-rose-hover' : 'border border-line text-navy hover:border-navy'
                  }`}
                  onClick={() => void toggleFeatured()}
                >
                  {featuredAt >= 0 ? `On Home (${featuredAt + 1} of ${featured.length}) · Remove from Home` : 'Feature on Home'}
                </button>
              )}
              {canDelete && (
                <button type="button" className="font-sans text-xs text-muted hover:text-rose-deep" onClick={() => void deletePhoto()}>
                  Delete this photo
                </button>
              )}
            </div>
            {problem && !draft && <p className="mt-2 font-sans text-sm text-rose-deep">{problem}</p>}
          </div>

          {draft && (
            <div className="card space-y-4 border-rose/60 p-5">
              <h2 className="text-lg">Who is this?</h2>
              <select className="field" value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">Choose a classmate</option>
                {untagged.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id === memberId ? 'Me: ' : ''}
                    {m.name}
                    {m.college ? ` (${m.college})` : ''}
                  </option>
                ))}
              </select>
              <p className="font-sans text-sm text-muted">
                {choice === memberId
                  ? 'Tagging yourself shows straight away.'
                  : 'They will be asked to confirm before the tag is shown to anyone else.'}
              </p>
              {problem && <p className="font-sans text-sm text-rose-deep">{problem}</p>}
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
                      <Avatar name={person.name} src={person.avatarUrl} size="sm" />
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
      {full && (
        <PhotoLightbox
          photos={all}
          startIndex={Math.max(index, 0)}
          onClose={(currentId) => {
            setFull(false)
            if (currentId !== photo.id) navigate(`/photos/${currentId}`)
          }}
        />
      )}
    </div>
  )
}

function PagerLink({ to, label, dir }: { to?: string; label: string; dir: 'prev' | 'next' }) {
  const cls =
    'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-sans text-sm font-semibold no-underline transition'
  const arrow = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
  const content = dir === 'prev' ? (
    <>
      {arrow}
      {label}
    </>
  ) : (
    <>
      {label}
      {arrow}
    </>
  )
  if (!to) return <span className={`${cls} border-line text-muted/50`}>{content}</span>
  return (
    <Link to={to} className={`${cls} border-line bg-white text-navy hover:border-navy hover:bg-rose-soft`}>
      {content}
    </Link>
  )
}
