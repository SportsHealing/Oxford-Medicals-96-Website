import { Link } from 'react-router-dom'
import type { SpeechSummary } from '../data/types.ts'
import SpeechPdfButton from './SpeechPdfButton.tsx'

export default function SpeechCard({ speech: s }: { speech: SpeechSummary }) {
  return (
    <li className="card card-hover relative flex h-full flex-col p-6">
      <h3 className="text-2xl">
        {/* The title link covers the whole card; the PDF button sits above it. */}
        <Link to={`/speeches/${s.slug}`} className="no-underline after:absolute after:inset-0 after:content-['']">
          {s.title}
        </Link>
      </h3>
      <p className="mt-1.5 font-sans text-[0.95rem] text-ink">{s.speaker}</p>
      {s.occasion && <p className="font-sans text-sm text-muted">{s.occasion}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
        <span className="font-sans text-sm font-semibold text-navy">Read &rarr;</span>
        {s.pdfName && <SpeechPdfButton slug={s.slug} className="relative z-10" />}
      </div>
    </li>
  )
}
