import { Link } from 'react-router-dom'
import type { SpeechSummary } from '../data/types.ts'
import SpeechPdfButton from './SpeechPdfButton.tsx'

export default function SpeechCard({ speech: s, showYear = true }: { speech: SpeechSummary; showYear?: boolean }) {
  return (
    <li className="card card-hover relative flex h-full flex-col p-6">
      {showYear && s.year && <p className="label-caps mb-1">{s.year}</p>}
      <h3 className="text-2xl">
        {/* The title link covers the whole card; the PDF buttons sit above it. */}
        <Link to={`/speeches/${s.slug}`} className="no-underline after:absolute after:inset-0 after:content-['']">
          {s.title}
        </Link>
      </h3>
      {s.speaker && <p className="mt-1.5 font-sans text-[0.95rem] text-ink">{s.speaker}</p>}
      {s.occasion && <p className="font-sans text-sm text-muted">{s.occasion}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        <span className="font-sans text-sm font-semibold text-navy">Open &rarr;</span>
        {s.pdfName && <SpeechPdfButton slug={s.slug} compact className="relative z-10" />}
      </div>
    </li>
  )
}
