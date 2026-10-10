import { useState } from 'react'
import { repo } from '../data/repo.ts'

// Fetches the PDF only when pressed, then hands it to the browser to save.
export default function SpeechPdfButton({ slug, className = '' }: { slug: string; className?: string }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const download = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const pdf = await repo.getSpeechPdf(slug)
      if (!pdf) throw new Error('No PDF')
      const url = URL.createObjectURL(pdf.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = pdf.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-3 ${className}`}>
      <button type="button" onClick={download} disabled={busy} className="btn-outline !py-2 text-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" />
        </svg>
        {busy ? 'Preparing…' : 'Download PDF'}
      </button>
      {failed && <span className="font-sans text-sm text-rose-deep">The PDF could not be downloaded. Please try again.</span>}
    </span>
  )
}
