import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

const PAGE = 48

export default function Gallery() {
  const { data: photos, loading, error } = useLoad(() => repo.listPhotos(), [])
  const [year, setYear] = useState<string>('all')
  // Draw 48 cards at a time and add more as the visitor scrolls near the end.
  const [limit, setLimit] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setLimit((n) => n + PAGE)
    }, { rootMargin: '800px' })
    io.observe(el)
    return () => io.disconnect()
  })

  if (loading) return <Loading what="Fetching the photos" />
  if (error) return <LoadError message={error} />
  const all = photos ?? []
  const years = Array.from(new Set(all.map((p) => p.year).filter(Boolean) as string[])).sort()
  const shown = year === 'all' ? all : all.filter((p) => p.year === year)

  return (
    <div>
      <PageHeader
        eyebrow="The archive"
        title="Photos"
        lede="Open a photo to see who is in it, or to put a name to a face."
        actions={
          <Link to="/photos/new" className="btn-primary">
            + Add photos
          </Link>
        }
      />

      {all.length === 0 ? (
        <div className="card p-10 text-center">
          <h2 className="text-2xl">No photos yet</h2>
          <p className="mt-2 text-muted">Be the first to share one.</p>
          <Link to="/photos/new" className="btn-primary mt-5">
            + Add photos
          </Link>
        </div>
      ) : (
        <>
          {years.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <Chip active={year === 'all'} onClick={() => { setYear('all'); setLimit(PAGE) }}>
                All years
              </Chip>
              {years.map((y) => (
                <Chip key={y} active={year === y} onClick={() => { setYear(y); setLimit(PAGE) }}>
                  {y}
                </Chip>
              ))}
            </div>
          )}

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.slice(0, limit).map((photo) => {
              const confirmed = photo.tags.filter((t) => t.status === 'confirmed').length
              const pending = photo.tags.filter((t) => t.status === 'pending').length
              return (
                <li key={photo.id}>
                  <Link to={`/photos/${photo.id}`} className="card card-hover group block overflow-hidden no-underline">
                    <div className="overflow-hidden bg-paper">
                      <img
                        src={photo.thumb}
                        alt={photo.title}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-5">
                      <p className="label-caps truncate">
                        {[photo.year, photo.place].filter(Boolean).join(' · ') || 'Undated'}
                      </p>
                      <h2 className="mt-1 text-xl">{photo.title}</h2>
                      <p className="mt-3 flex items-center gap-2 font-sans text-sm text-muted">
                        <span className="inline-block h-2 w-2 rounded-full bg-rose" />
                        {confirmed} named
                        {pending > 0 && <span className="text-muted/80">&middot; {pending} to confirm</span>}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
          {shown.length > limit && <div ref={sentinel} className="h-10" aria-hidden />}
        </>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 font-sans text-sm font-semibold transition ${
        active ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted hover:border-navy hover:text-navy'
      }`}
    >
      {children}
    </button>
  )
}
