import PageHeader from '../components/PageHeader.tsx'
import SpeechCard from '../components/SpeechCard.tsx'
import { listSpeeches } from '../data/archive.ts'
import type { Speech } from '../data/types.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

export default function Speeches() {
  const { data, loading, error } = useLoad(() => listSpeeches(), [])

  if (loading) return <Loading what="Fetching the speeches" />
  if (error) return <LoadError message={error} />

  // Newest first, one section per year; speeches with no year go last.
  const byYear = new Map<string, Speech[]>()
  for (const s of data ?? []) {
    const k = s.year ? String(s.year) : 'Other years'
    byYear.set(k, [...(byYear.get(k) ?? []), s])
  }

  return (
    <div>
      <PageHeader eyebrow="Over the years" title="Speeches" lede="Speeches from our reunions and gatherings, to read, view or download." />
      {byYear.size === 0 ? (
        <p className="text-muted">No speeches have been added yet.</p>
      ) : (
        <div className="space-y-12">
          {[...byYear].map(([year, list]) => (
            <section key={year}>
              {byYear.size > 1 && (
                <h2 className="mb-4 flex items-baseline gap-3 text-3xl">
                  {year}
                  <span className="font-sans text-sm text-muted">
                    {list.length} {list.length === 1 ? 'speech' : 'speeches'}
                  </span>
                </h2>
              )}
              <ul className="grid gap-5 sm:grid-cols-2">
                {list.map((s) => (
                  <SpeechCard key={s.id} speech={s} showYear={byYear.size <= 1} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
