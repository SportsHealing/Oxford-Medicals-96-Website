import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import SpeechBody from '../components/SpeechBody.tsx'
import SpeechPdfButton from '../components/SpeechPdfButton.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'
import NotFound from './NotFound.tsx'

export default function SpeechView() {
  const { slug = '' } = useParams()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error } = useLoad(
    async () => {
      const [speech, all] = await Promise.all([repo.getSpeech(slug), repo.listSpeeches()])
      return { speech, others: all.filter((s) => s.slug !== slug) }
    },
    [slug],
  )

  const pdfOnly = Boolean(data?.speech && !data.speech.body && data.speech.pdfName)

  if (loading) return <Loading what="Opening the speech" />
  if (error) return <LoadError message={error} />
  if (!data?.speech) return <NotFound />
  const { speech, others } = data

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
        {speech.pdfName && <SpeechPdfButton slug={speech.slug} className="mt-5" />}
      </header>

      {speech.body ? <SpeechBody body={speech.body} /> : pdfOnly && <PdfPreview slug={speech.slug} />}
      {speech.pdfName && speech.body && <SpeechPdfButton slug={speech.slug} className="mt-10" />}

      {isAdmin && (
        <button
          type="button"
          className="mt-10 block font-sans text-xs text-muted hover:text-rose-deep"
          onClick={() => {
            if (!confirm(`Delete "${speech.title}"? Members will no longer see it.`)) return
            void repo.deleteSpeech(speech.id).then(
              () => navigate('/speeches'),
              (e: unknown) => alert(e instanceof Error ? e.message : 'Could not delete'),
            )
          }}
        >
          Delete this speech
        </button>
      )}

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
function PdfPreview({ slug }: { slug: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [wide] = useState(() => window.matchMedia?.('(min-width: 768px)').matches ?? false)

  useEffect(() => {
    if (!wide) return
    let live = true
    let made: string | null = null
    repo.getSpeechPdf(slug).then(
      (pdf) => {
        if (!live || !pdf) return
        made = URL.createObjectURL(pdf.blob)
        setUrl(made)
      },
      () => {},
    )
    return () => {
      live = false
      if (made) URL.revokeObjectURL(made)
    }
  }, [slug, wide])

  if (!wide) return <p className="card p-5 text-muted">This speech is a PDF. Press View PDF above to read it, or Download to keep a copy.</p>
  if (!url) return <p className="py-10 text-center text-muted">Opening the PDF&hellip;</p>
  return <iframe src={url} title="The speech (PDF)" className="h-[80vh] w-full rounded-2xl border border-line bg-white" />
}
