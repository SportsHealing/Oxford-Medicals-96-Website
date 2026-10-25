import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SpeechBody from '../components/SpeechBody.tsx'
import SpeechPdfButton from '../components/SpeechPdfButton.tsx'
import { listSpeeches, speechPdfBlob } from '../data/archive.ts'
import type { Speech } from '../data/types.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'
import NotFound from './NotFound.tsx'

export default function SpeechView() {
  const { slug = '' } = useParams()
  const { data, loading, error } = useLoad(() => listSpeeches(), [])

  if (loading) return <Loading what="Opening the speech" />
  if (error) return <LoadError message={error} />
  const speech = (data ?? []).find((s) => s.slug === slug)
  if (!speech) return <NotFound />
  const others = (data ?? []).filter((s) => s.slug !== slug)
  const pdfOnly = !speech.body && Boolean(speech.pdf)

  return (
    <article className={`mx-auto ${pdfOnly ? 'max-w-4xl' : 'max-w-2xl'}`}>
      <Link to="/speeches" className="mb-6 inline-block font-sans text-sm text-muted no-underline hover:text-navy">
        &larr; All speeches
      </Link>
      <header className="mb-10">
        {(speech.occasion || speech.year) && <p className="eyebrow mb-2">{[speech.occasion, speech.year].filter(Boolean).join(' · ')}</p>}
        <h1 className="text-4xl leading-tight sm:text-5xl">{speech.title}</h1>
        <span className="mt-3 block h-[3px] w-12 rounded-full bg-rose" />
        {speech.speaker && <p className="mt-4 font-sans text-lg text-muted">{speech.speaker}</p>}
        <SpeechPdfButton speech={speech} className="mt-5" />
      </header>

      {speech.body ? <SpeechBody body={speech.body} /> : pdfOnly && <PdfPreview speech={speech} />}
      {speech.body && <SpeechPdfButton speech={speech} className="mt-10" />}

      {others.length > 0 && (
        <aside className="mt-14 border-t border-line pt-6">
          <p className="eyebrow mb-3">More speeches</p>
          <ul className="space-y-2">
            {others.map((s) => (
              <li key={s.id}>
                <Link to={`/speeches/${s.slug}`} className="font-serif text-xl">
                  {s.title}
                </Link>
                {s.speaker && <span className="font-sans text-muted"> &middot; {s.speaker}</span>}
                {s.year && <span className="font-sans text-sm text-muted"> &middot; {s.year}</span>}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  )
}

// A PDF-only speech shown on the page. Phones show PDFs poorly inside a page,
// so there the View PDF button above is the way in.
function PdfPreview({ speech }: { speech: Speech }) {
  const [wide] = useState(() => window.matchMedia?.('(min-width: 768px)').matches ?? false)
  const url = useMemo(() => {
    const blob = wide ? speechPdfBlob(speech) : null
    return blob ? URL.createObjectURL(blob) : null
  }, [speech, wide])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])

  if (!wide) return <p className="card p-5 text-muted">This speech is a PDF. Press View PDF above to read it, or Download to keep a copy.</p>
  if (!url) return <p className="py-10 text-center text-muted">Opening the PDF&hellip;</p>
  return <iframe src={url} title="The speech (PDF)" className="h-[80vh] w-full rounded-2xl border border-line bg-white" />
}
