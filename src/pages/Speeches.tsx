import PageHeader from '../components/PageHeader.tsx'
import SpeechCard from '../components/SpeechCard.tsx'
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
            <SpeechCard key={s.id} speech={s} />
          ))}
        </ul>
      ) : (
        <p className="text-muted">No speeches have been added yet.</p>
      )}
    </div>
  )
}
