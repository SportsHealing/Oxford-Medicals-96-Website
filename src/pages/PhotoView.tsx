import { useState, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { people, personById, photoById, type Tag } from '../data/sample.ts'
import NotFound from './NotFound.tsx'

export default function PhotoView() {
  const { id } = useParams()
  const photo = id ? photoById(id) : undefined
  const [tags, setTags] = useState<Tag[]>(photo?.tags ?? [])
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [choice, setChoice] = useState('')

  if (!photo) return <NotFound />

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
    <div className="space-y-6">
      <Link to="/photos" className="font-sans text-sm">
        &larr; All photos
      </Link>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div>
          <div
            className="relative cursor-crosshair overflow-hidden rounded-xl border border-gray-200"
            onClick={placeTag}
            title="Click on a face to add a name"
          >
            <img src={photo.src} alt={photo.title} className="block w-full" />
            {tags.map((tag) => {
              const person = personById(tag.personId)
              return (
                <span
                  key={tag.personId}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-2 py-0.5 font-sans text-xs font-semibold shadow ${
                    tag.status === 'confirmed'
                      ? 'border-pink bg-rita text-navy'
                      : 'border-dashed border-navy bg-white/90 text-navy'
                  }`}
                  style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                >
                  {person?.knownAs ?? person?.name}
                  {tag.status === 'pending' ? '?' : ''}
                </span>
              )
            })}
            {draft && (
              <span
                className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pink-deep bg-white"
                style={{ left: `${draft.x}%`, top: `${draft.y}%` }}
              />
            )}
          </div>
          <p className="mt-2 font-sans text-sm text-gray-600">
            Click on a face to add a name. Dashed tags are waiting for the person to confirm.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl">{photo.title}</h1>
            <p className="font-sans text-gray-600">
              {photo.year}. {photo.place}.
            </p>
            <p className="mt-3 text-gray-700">{photo.caption}</p>
          </div>

          <div>
            <h2 className="text-xl">Who is in this photo</h2>
            <ul className="mt-2 divide-y divide-gray-200">
              {tags.map((tag) => {
                const person = personById(tag.personId)
                if (!person) return null
                return (
                  <li key={tag.personId} className="flex items-center justify-between gap-3 py-2">
                    <Link to={`/classmates/${person.id}`} className="font-sans font-semibold">
                      {person.name}
                    </Link>
                    <span
                      className={`rounded-full px-2 py-0.5 font-sans text-xs ${
                        tag.status === 'confirmed' ? 'bg-rita text-navy' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tag.status === 'confirmed' ? 'Confirmed' : 'Awaiting confirmation'}
                    </span>
                  </li>
                )
              })}
              {tags.length === 0 && <li className="py-2 text-gray-600">No one named yet.</li>}
            </ul>
          </div>

          {draft && (
            <div className="space-y-3 rounded-xl bg-blush p-4">
              <h2 className="text-xl">Add a name</h2>
              <select className="field" value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">Choose a classmate</option>
                {untagged.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.college})
                  </option>
                ))}
              </select>
              <p className="font-sans text-sm text-gray-700">
                They will be asked to confirm before the tag is shown to anyone else.
              </p>
              <div className="flex gap-2">
                <button type="button" className="btn-primary" onClick={saveTag} disabled={!choice}>
                  Suggest tag
                </button>
                <button type="button" className="btn-outline" onClick={() => setDraft(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
