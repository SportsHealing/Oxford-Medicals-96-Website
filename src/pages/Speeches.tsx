import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.tsx'
import SpeechPdfButton from '../components/SpeechPdfButton.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

export default function Speeches() {
  const { data, loading, error } = useLoad(() => repo.listSpeeches(), [])

  if (loading) return <Loading what="Fetching the speeches" />
  if (error) return <LoadError message={error} />

  return (
    <div>
      <PageHeader eyebrow="Thirty years on" title="Speeches" lede="Words from the reunion, kept here for everyone who was there and everyone who wasn't." />
      {data && data.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2">
          {data.map((s) => (
            <li key={s.id} className="card card-hover relative flex h-full flex-col p-6">
              <h2 className="text-2xl">
                {/* The title link covers the whole card; the PDF button sits above it. */}
                <Link to={`/speeches/${s.slug}`} className="no-underline after:absolute after:inset-0 after:content-['']">
                  {s.title}
                </Link>
              </h2>
              <p className="mt-1.5 font-sans text-[0.95rem] text-ink">{s.speaker}</p>
              {s.occasion && <p className="font-sans text-sm text-muted">{s.occasion}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
                <span className="font-sans text-sm font-semibold text-navy">Read &rarr;</span>
                {s.pdfName && <SpeechPdfButton slug={s.slug} className="relative z-10" />}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No speeches have been added yet.</p>
      )}
    </div>
  )
}
