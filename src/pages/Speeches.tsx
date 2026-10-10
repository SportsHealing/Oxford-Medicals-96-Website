import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.tsx'
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
            <li key={s.id}>
              <Link to={`/speeches/${s.slug}`} className="card card-hover block h-full p-6 no-underline">
                <h2 className="text-2xl">{s.title}</h2>
                <p className="mt-1.5 font-sans text-[0.95rem] text-ink">{s.speaker}</p>
                {s.occasion && <p className="font-sans text-sm text-muted">{s.occasion}</p>}
                <span className="mt-4 inline-block font-sans text-sm font-semibold text-navy">Read &rarr;</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No speeches have been added yet.</p>
      )}
    </div>
  )
}
