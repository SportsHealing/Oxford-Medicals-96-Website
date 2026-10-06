import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.tsx'
import { repo } from '../data/repo.ts'
import { prepareImage } from '../lib/prepareImage.ts'

type Item = { file: File; preview: string; title: string }

export default function AddPhotos() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [year, setYear] = useState('')
  const [place, setPlace] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [problem, setProblem] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const pick = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files)
      .filter((f) => f.type.startsWith('image/') || /\.hei[cf]$/i.test(f.name))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
      }))
    setItems((cur) => [...cur, ...next].slice(0, 20))
  }

  const remove = (i: number) => setItems((cur) => cur.filter((_, j) => j !== i))
  const rename = (i: number, title: string) =>
    setItems((cur) => cur.map((it, j) => (j === i ? { ...it, title } : it)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setBusy(true)
    setProblem(null)
    setProgress(0)
    const ids: string[] = []
    try {
      for (const it of items) {
        const file = await prepareImage(it.file)
        ids.push(
          await repo.addPhoto({
            file,
            title: it.title.trim() || 'Untitled',
            year: year.trim(),
            place: place.trim(),
            caption: caption.trim(),
          }),
        )
        setProgress(ids.length)
      }
      const [first, ...rest] = ids
      const q = new URLSearchParams({ new: '1' })
      if (rest.length) q.set('queue', rest.join(','))
      navigate(`/photos/${first}?${q.toString()}`)
    } catch (err) {
      setProblem(
        `${err instanceof Error ? err.message : 'Upload failed'}.` +
          (ids.length ? ` ${ids.length} of ${items.length} uploaded before the problem.` : ''),
      )
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/photos" className="mb-6 inline-block font-sans text-sm text-muted no-underline hover:text-navy">
        &larr; All photos
      </Link>
      <PageHeader
        eyebrow="Share"
        title="Add photos"
        lede="Up to 20 at a time. Next, you'll be able to tag the people you know in each one."
      />

      <form onSubmit={(e) => void submit(e)} className="space-y-8">
        <div
          className={`card flex flex-col items-center justify-center gap-4 border-2 border-dashed p-10 text-center transition ${
            dragging ? 'border-rose bg-rose-soft' : 'border-line'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            pick(e.dataTransfer.files)
          }}
        >
          <label className="btn-primary cursor-pointer">
            {items.length ? 'Choose more photos' : 'Choose photos'}
            <input
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="sr-only"
              onChange={(e) => {
                pick(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
          <span className="font-sans text-sm text-muted">
            or drag them here from your computer. Phone photos, scans of prints, anything.
          </span>
        </div>

        {items.length > 0 && (
          <>
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((it, i) => (
                <li key={it.preview} className="card flex gap-3 p-3">
                  <img src={it.preview} alt="" className="h-20 w-24 shrink-0 rounded-lg bg-paper object-cover" />
                  <div className="min-w-0 flex-1">
                    <label className="block">
                      <span className="label-caps">Title</span>
                      <input className="field mt-1 !py-2" value={it.title} onChange={(e) => rename(i, e.target.value)} />
                    </label>
                    <button type="button" className="mt-1 font-sans text-xs text-muted hover:text-rose-deep" onClick={() => remove(i)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <section className="card space-y-4 p-6">
              <p className="eyebrow">About these photos (optional)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label-caps">Year</span>
                  <input className="field mt-1.5" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 1994" />
                </label>
                <label className="block">
                  <span className="label-caps">Place</span>
                  <input className="field mt-1.5" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g. Osler House" />
                </label>
              </div>
              <label className="block">
                <span className="label-caps">Caption</span>
                <textarea className="field mt-1.5" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />
              </label>
              <p className="font-sans text-sm text-muted">Applies to all the photos above. You can change each one later.</p>
            </section>
          </>
        )}

        {problem && <p className="font-sans text-sm text-rose-deep">{problem}</p>}
        {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy
              ? `Uploading ${progress + 1} of ${items.length}…`
              : `Upload ${items.length || ''} photo${items.length === 1 ? '' : 's'} and tag people`}
          </button>
          <span className="font-sans text-sm text-muted">Only signed-in classmates will see them.</span>
        </div>
        )}
      </form>
    </div>
  )
}
