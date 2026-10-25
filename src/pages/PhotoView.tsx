import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import EncImage from '../components/EncImage.tsx'
import PhotoLightbox from '../components/PhotoLightbox.tsx'
import { listPhotos } from '../data/archive.ts'
import { categoryLabel } from '../lib/photoCategories.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'
import NotFound from './NotFound.tsx'

export default function PhotoView() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Opened from a category on the Photos page: Previous and Next stay inside it.
  const within = params.get('in') ?? ''
  const { data, loading, error } = useLoad(() => listPhotos(), [])
  const [full, setFull] = useState(false)

  if (loading) return <Loading what="Opening the photo" />
  if (error) return <LoadError message={error} />
  const everything = data ?? []
  const photo = everything.find((p) => p.id === id)
  if (!photo) return <NotFound />

  const all = within ? everything.filter((p) => (p.category || 'unsorted') === within) : everything
  const inQuery = within ? `?in=${encodeURIComponent(within)}` : ''
  const index = all.findIndex((p) => p.id === photo.id)
  const prev = all[index - 1]
  const next = all[index + 1]

  return (
    <div>
      <div className="mb-6">
        <Link to={within ? `/photos?c=${encodeURIComponent(within)}` : '/photos'} className="font-sans text-sm text-muted no-underline hover:text-navy">
          &larr; {within ? (within === 'unsorted' ? 'Other photos' : categoryLabel(within)) : 'All photos'}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="card flex items-center justify-center overflow-hidden bg-paper lg:h-[65vh]">
            <div className="relative inline-block max-w-full">
              <EncImage path={photo.full} alt={photo.title} className="block max-h-[65vh] w-auto max-w-full" />
              <button
                type="button"
                onClick={() => setFull(true)}
                className="absolute top-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-navy/85 px-4 py-2 font-sans text-sm font-semibold text-white shadow-card backdrop-blur transition hover:bg-navy"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
                Full screen
              </button>
            </div>
          </div>
          <nav className="mt-4 flex items-center justify-center gap-4" aria-label="Photo navigation">
            <PagerLink to={prev ? `/photos/${prev.id}${inQuery}` : undefined} label="Previous" dir="prev" />
            <span className="min-w-[5.5rem] text-center font-sans text-sm text-muted">
              {index + 1} of {all.length}
            </span>
            <PagerLink to={next ? `/photos/${next.id}${inQuery}` : undefined} label="Next" dir="next" />
          </nav>
        </div>

        <aside>
          {photo.category && (
            <Link to={`/photos?c=${photo.category}`} className="mb-2 inline-block rounded-full bg-rose-soft px-3 py-1 font-sans text-xs font-semibold text-navy no-underline hover:bg-rose">
              {categoryLabel(photo.category)}
            </Link>
          )}
          <p className="label-caps">{[photo.year, photo.place].filter(Boolean).join(' · ') || 'Undated'}</p>
          <h1 className="mt-1 text-3xl">{photo.title}</h1>
          {photo.caption && <p className="mt-3 text-muted">{photo.caption}</p>}
          <p className="mt-6 font-sans text-sm text-muted">
            Know who is in this photo, or when it was taken? Tell one of the organisers and they will add it.
          </p>
        </aside>
      </div>
      {full && (
        <PhotoLightbox
          photos={all}
          startIndex={Math.max(index, 0)}
          onClose={(currentId) => {
            setFull(false)
            if (currentId !== photo.id) navigate(`/photos/${currentId}${inQuery}`)
          }}
        />
      )}
    </div>
  )
}

function PagerLink({ to, label, dir }: { to?: string; label: string; dir: 'prev' | 'next' }) {
  const cls = 'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-sans text-sm font-semibold no-underline transition'
  const arrow = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
  if (!to) {
    return (
      <span className={`${cls} border-line text-muted/50`} aria-disabled>
        {dir === 'prev' && arrow}
        {label}
        {dir === 'next' && arrow}
      </span>
    )
  }
  return (
    <Link to={to} className={`${cls} border-line text-navy hover:border-navy`}>
      {dir === 'prev' && arrow}
      {label}
      {dir === 'next' && arrow}
    </Link>
  )
}
