import { useState, type FormEvent } from 'react'
import { repo } from '../data/repo.ts'
import type { Photo } from '../data/types.ts'
import { PHOTO_CATEGORIES } from '../lib/photoCategories.ts'

// Title, year, place, caption and category, for admins and the person who added the photo.
export default function PhotoDetailsForm({ photo, onDone }: { photo: Photo; onDone: (saved: boolean) => void }) {
  const [title, setTitle] = useState(photo.title)
  const [year, setYear] = useState(photo.year ?? '')
  const [place, setPlace] = useState(photo.place ?? '')
  const [caption, setCaption] = useState(photo.caption ?? '')
  const [category, setCategory] = useState(photo.category ?? '')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const withCategories = repo.hasPhotoCategories()

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setProblem(null)
    try {
      await repo.updatePhoto(photo.id, { title, year: year || null, place: place || null, caption: caption || null, category: category || null })
      onDone(true)
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not save')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="card space-y-4 border-navy/20 p-5">
      <h2 className="text-lg">Edit details</h2>
      <label className="block">
        <span className="label-caps">Title</span>
        <input className="field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </label>
      {withCategories && (
        <label className="block">
          <span className="label-caps">Category</span>
          <select className="field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Not sorted yet</option>
            {PHOTO_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {photo.categorySource === 'ai' && <span className="mt-1 block font-sans text-xs text-muted">Suggested by the AI. Saving marks it as checked.</span>}
        </label>
      )}
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <label className="block">
          <span className="label-caps">Year</span>
          <input className="field mt-1" value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" placeholder="1995" maxLength={9} />
        </label>
        <label className="block">
          <span className="label-caps">Place</span>
          <input className="field mt-1" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Osler House" maxLength={80} />
        </label>
      </div>
      <label className="block">
        <span className="label-caps">Caption</span>
        <textarea className="field mt-1" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} />
      </label>
      {problem && <p className="font-sans text-sm text-rose-deep">{problem}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn-quiet" onClick={() => onDone(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
