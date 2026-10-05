import { useState, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar.tsx'
import { people, personById, photoById, photos, type Tag } from '../data/sample.ts'
import NotFound from './NotFound.tsx'

export default function PhotoView() {
  const { id } = useParams()
  const photo = id ? photoById(id) : undefined
  const [tags, setTags] = useState<Tag[]>(photo?.tags ?? [])
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [choice, setChoice] = useState('')
  const [showLabels, setShowLabels] = useState(true)

  if (!photo) return <NotFound />

  const index = photos.findIndex((p) => p.id === photo.id)
  const prev = photos[index - 1]
  const next = photos[index + 1]

  const placeTag = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setDraft({ x, y })
    setChoice('')
  }

  const saveTag = () => {
    if (!draft || !choice) return
    setTags([...tags, { personId: choice, x: draft.x, y: draft.y, status: 'pending' }])
    setDraft(null)
    setChoice('')
  }

  const untagged = people.filter((p) => p.allowsTags && !tags.some((t) => t.personId === p.id))

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
            className="card relative cursor-crosshair overflow-hidden"
            onClick={placeTag}
            title="Click on a face to add a name"
          >
            <img src={photo.src} alt={photo.title} className="block w-full" />
            {showLabels &&
              tags.map((tag) => {
                const person = personById(tag.personId)
                return (
                  <span
                    key={tag.personId}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/95 py-1 pr-2.5 pl-1.5 font-sans text-xs font-semibold text-navy shadow-card ${
                      tag.status === 'pending' ? 'ring-1 ring-navy/30 ring-inset' : ''
                    }`}
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${tag.status === 'confirmed' ? 'bg-pink' : 'bg-navy/30'}`}
                    />
                    {person?.knownAs ?? person?.name}
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
            <p className="label-caps">
              {photo.year} &middot; {photo.place}
            </p>
            <h1 className="mt-1 text-3xl">{photo.title}</h1>
            <p className="mt-3 text-muted">{photo.caption}</p>
          </div>

          {draft && (
            <div className="card space-y-4 border-pink/50 p-5">
              <h2 className="text-lg">Who is this?</h2>
              <select className="field" value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">Choose a classmate</option>
                {untagged.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.college})
                  </option>
                ))}
              </select>
              <p className="font-sans text-sm text-muted">
                They will be asked to confirm before the tag is shown to anyone else.
              </p>
              <div className="flex gap-2">
                <button type="button" className="btn-primary" onClick={saveTag} disabled={!choice}>
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
              {tags.map((tag) => {
                const person = personById(tag.personId)
                if (!person) return null
                return (
                  <li key={tag.personId}>
                    <Link
                      to={`/classmates/${person.id}`}
                      className="flex items-center gap-3 px-4 py-3 no-underline transition hover:bg-paper"
                    >
                      <Avatar name={person.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-sans font-semibold text-navy">{person.name}</span>
                        <span className="block truncate font-sans text-sm text-muted">{person.jobTitle}</span>
                      </span>
                      {tag.status === 'pending' && (
                        <span className="rounded-full bg-paper px-2 py-0.5 font-sans text-[0.7rem] font-semibold text-muted">
                          To confirm
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
              {tags.length === 0 && <li className="px-4 py-3 text-muted">No one named yet.</li>}
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
