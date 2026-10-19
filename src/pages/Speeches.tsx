import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import AddSpeechForm from '../components/AddSpeechForm.tsx'
import PageHeader from '../components/PageHeader.tsx'
import SpeechCard from '../components/SpeechCard.tsx'
import { repo } from '../data/repo.ts'
import type { SpeechSummary } from '../data/types.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

export default function Speeches() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error } = useLoad(() => repo.listSpeeches(), [])

  if (loading) return <Loading what="Fetching the speeches" />
  if (error) return <LoadError message={error} />

  // Newest first, one section per year; speeches with no year go last.
  const byYear = new Map<string, SpeechSummary[]>()
  for (const s of [...(data ?? [])].sort((a, b) => (b.year ?? -1) - (a.year ?? -1))) {
    const k = s.year ? String(s.year) : 'Other years'
    byYear.set(k, [...(byYear.get(k) ?? []), s])
  }
  const canAdd = isAdmin && repo.hasSpeechLibrary()

  return (
    <div>
      <PageHeader
        eyebrow="Over the years"
        title="Speeches"
        lede="Speeches from our reunions and gatherings, to read, view or download."
      />
      {canAdd && (
        <div className="mb-10">
          <AddSpeechForm onAdded={(slug) => navigate(`/speeches/${slug}`)} />
        </div>
      )}
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
