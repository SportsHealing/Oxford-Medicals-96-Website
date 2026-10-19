import { useState, type FormEvent } from 'react'
import { repo } from '../data/repo.ts'

const MAX_MB = 8

// Admins: add a speech from any year as a PDF.
export default function AddSpeechForm({ onAdded }: { onAdded: (slug: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [speaker, setSpeaker] = useState('')
  const [occasion, setOccasion] = useState('')
  const [year, setYear] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  if (!open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        + Add a speech
      </button>
    )
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setProblem(null)
    const y = year ? Number(year) : null
    if (y !== null && !(y >= 1980 && y <= 2100)) return setProblem('Enter a year such as 2016, or leave it blank.')
    if (!file) return setProblem('Choose the PDF.')
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return setProblem('That file is not a PDF.')
    if (file.size > MAX_MB * 1024 * 1024) return setProblem(`That PDF is over ${MAX_MB} MB. Please use a smaller copy.`)
    setBusy(true)
    try {
      const slug = await repo.addSpeech({ title, speaker: speaker || null, occasion: occasion || null, year: y, file })
      onAdded(slug)
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not add the speech')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="card w-full space-y-4 border-navy/20 p-5 sm:p-6">
      <h2 className="text-2xl">Add a speech</h2>
      <p className="font-sans text-sm text-muted">Members will be able to view and download it. Only add speeches the speaker is happy to share.</p>
      <label className="block">
        <span className="label-caps">Title</span>
        <input className="field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder="Ten years on" />
      </label>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
        <label className="block">
          <span className="label-caps">Speaker</span>
          <input className="field mt-1" value={speaker} onChange={(e) => setSpeaker(e.target.value)} maxLength={80} placeholder="First name" />
        </label>
        <label className="block">
          <span className="label-caps">Occasion</span>
          <input className="field mt-1" value={occasion} onChange={(e) => setOccasion(e.target.value)} maxLength={120} placeholder="10th reunion dinner" />
        </label>
        <label className="block">
          <span className="label-caps">Year</span>
          <input className="field mt-1" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="2006" />
        </label>
      </div>
      <label className="block">
        <span className="label-caps">PDF</span>
        <input
          className="mt-1 block w-full font-sans text-sm file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:font-semibold file:text-white"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
      </label>
      {problem && <p className="font-sans text-sm text-rose-deep">{problem}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Adding…' : 'Add speech'}
        </button>
        <button type="button" className="btn-quiet" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}
