import { Link, useParams } from 'react-router-dom'
import SpeechBody from '../components/SpeechBody.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'
import NotFound from './NotFound.tsx'

export default function SpeechView() {
  const { slug = '' } = useParams()
  const { data, loading, error } = useLoad(
    async () => {
      const [speech, all] = await Promise.all([repo.getSpeech(slug), repo.listSpeeches()])
      return { speech, others: all.filter((s) => s.slug !== slug) }
    },
    [slug],
  )

  if (loading) return <Loading what="Opening the speech" />
  if (error) return <LoadError message={error} />
  if (!data?.speech) return <NotFound />
  const { speech, others } = data

  return (
    <article className="mx-auto max-w-2xl">
      <Link to="/speeches" className="mb-6 inline-block font-sans text-sm text-muted no-underline hover:text-navy">
        &larr; All speeches
      </Link>
      <header className="mb-10">
        {speech.occasion && <p className="eyebrow mb-2">{speech.occasion}</p>}
        <h1 className="text-4xl leading-tight sm:text-5xl">{speech.title}</h1>
        <span className="mt-3 block h-[3px] w-12 rounded-full bg-rose" />
        {speech.speaker && <p className="mt-4 font-sans text-lg text-muted">{speech.speaker}</p>}
      </header>

      <SpeechBody body={speech.body} />

      {others.length > 0 && (
        <aside className="mt-14 border-t border-line pt-6">
          <p className="eyebrow mb-3">Also from the reunion</p>
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
