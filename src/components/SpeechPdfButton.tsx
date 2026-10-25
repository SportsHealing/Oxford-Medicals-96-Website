import { useState } from 'react'
import { speechPdfBlob } from '../data/archive.ts'
import type { Speech } from '../data/types.ts'

const icon = {
  view: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z',
  download: 'M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14',
}

// View opens the PDF in a new tab; Download saves it.
export default function SpeechPdfButton({ speech, className = '', compact = false }: { speech: Speech; className?: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!speech.pdf) return null

  const run = (mode: 'view' | 'download') => {
    setFailed(false)
    const blob = speechPdfBlob(speech)
    if (!blob) return setFailed(true)
    const url = URL.createObjectURL(blob)
    if (mode === 'view') {
      const tab = window.open(url, '_blank')
      if (!tab) window.location.assign(url)
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = speech.pdf!.name
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000)
  }

  const btn = `btn-outline ${compact ? '!px-3.5 !py-1.5 text-sm' : '!py-2 text-sm'}`
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      {(['view', 'download'] as const).map((mode) => (
        <button key={mode} type="button" onClick={() => run(mode)} className={btn}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={icon[mode]} />
          </svg>
          {mode === 'view' ? 'View PDF' : 'Download'}
        </button>
      ))}
      {failed && <span className="w-full font-sans text-sm text-rose-deep">The PDF could not be opened.</span>}
    </span>
  )
}
