import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EncImage from '../components/EncImage.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { listPhotos } from '../data/archive.ts'
import type { Photo } from '../data/types.ts'
import { PHOTO_CATEGORIES, categoryLabel } from '../lib/photoCategories.ts'
import { foldText } from '../lib/text.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

// Thumbnails are drawn in pages as the visitor scrolls, so 800 photos open quickly.
const PAGE = { thumbs: 96, large: 36 }
const UNSORTED = 'unsorted'

type Group = { id: string; label: string; photos: Photo[] }

export default function Gallery() {
  const { data: photos, loading, error } = useLoad(() => listPhotos(), [])
  const [params, setParams] = useSearchParams()
  const cat = params.get('c') ?? ''
  const year = params.get('y') ?? ''
  const view: 'thumbs' | 'large' = params.get('view') === 'large' ? 'large' : 'thumbs'
  const [query, setQuery] = useState(params.get('q') ?? '')
  // Arriving from a front-page photo: scroll to it and highlight it.
  const focus = params.get('focus') ?? ''

  const [limit, setLimit] = useState(PAGE[view])
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((n) => n + PAGE[view])
      },
      { rootMargin: '1200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  })

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setLimit(PAGE[key === 'view' && value === 'large' ? 'large' : 'thumbs'])
  }

  // Keep the search in the address quietly, so Back from a photo restores it.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if ((params.get('q') ?? '') === query) return
      const next = new URLSearchParams(params)
      if (query) next.set('q', query)
      else next.delete('q')
      setParams(next, { replace: true })
    }, 400)
    return () => window.clearTimeout(t)
  }, [query, params, setParams])

  const all = useMemo(() => photos ?? [], [photos])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of all) {
      const k = p.category || UNSORTED
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [all])
  const years = useMemo(() => Array.from(new Set(all.map((p) => p.year).filter(Boolean) as string[])).sort(), [all])
  const hasCats = [...counts.keys()].some((k) => k !== UNSORTED)

  const words = foldText(query).split(/\s+/).filter(Boolean)
  const shown = all.filter((p) => {
    if (cat && (p.category || UNSORTED) !== cat) return false
    if (year && p.year !== year) return false
    if (words.length === 0) return true
    const text = foldText([p.title, p.caption, p.place, p.year, p.category ? categoryLabel(p.category) : ''].filter(Boolean).join(' '))
    return words.every((w) => text.includes(w))
  })

  // With categories and no category chosen, show one section per category.
  const groups: Group[] =
    hasCats && !cat
      ? [...PHOTO_CATEGORIES.map((c) => c.id as string), UNSORTED]
          .map((id) => ({
            id,
            label: id === UNSORTED ? 'Other photos' : categoryLabel(id),
            photos: shown.filter((p) => (p.category || UNSORTED) === id),
          }))
          .filter((g) => g.photos.length > 0)
      : [{ id: cat, label: '', photos: shown }]
  const flat = groups.flatMap((g) => g.photos)
  const focusAt = focus ? flat.findIndex((p) => p.id === focus) : -1

  useEffect(() => {
    if (focusAt < 0) return
    const t = window.setTimeout(() => document.getElementById(`photo-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150)
    return () => window.clearTimeout(t)
  }, [focus, focusAt])

  if (loading) return <Loading what="Opening the photos" />
  if (error) return <LoadError message={error} />

  if (all.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="The archive" title="Photos" />
        <div className="card p-10 text-center">
          <h2 className="text-2xl">The photos are on their way</h2>
          <p className="mt-2 text-muted">The organisers have not published the photo archive yet. Please check back soon.</p>
          <Link to="/speeches" className="btn-outline mt-5">
            Read the speeches meanwhile
          </Link>
        </div>
      </div>
    )
  }

  // Make sure the highlighted photo is among those drawn.
  let budget = Math.max(limit, focusAt + 1 + PAGE[view])

  return (
    <div>
      <PageHeader eyebrow="The archive" title="Photos" lede={`${all.length} photos from our years at Oxford and since. Open one to see it large.`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="field w-full sm:w-72"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(PAGE[view])
          }}
          placeholder="Search titles, places, years…"
          aria-label="Search photos"
        />
        {years.length > 1 && (
          <select className="field w-auto" value={year} onChange={(e) => setParam('y', e.target.value)} aria-label="Year">
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
        <div role="tablist" aria-label="Photo size" className="ml-auto grid grid-cols-2 rounded-full bg-paper p-1 font-sans text-sm font-semibold">
          {(['thumbs', 'large'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setParam('view', v === 'large' ? 'large' : '')}
              className={`rounded-full px-4 py-1.5 transition ${view === v ? 'bg-white text-navy shadow-card' : 'text-muted hover:text-navy'}`}
            >
              {v === 'thumbs' ? 'Small' : 'Large'}
            </button>
          ))}
        </div>
      </div>

      {hasCats && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Chip active={!cat} onClick={() => setParam('c', '')}>
            All {all.length}
          </Chip>
          {PHOTO_CATEGORIES.filter((c) => counts.get(c.id)).map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setParam('c', cat === c.id ? '' : c.id)} title={c.hint}>
              {c.label} {counts.get(c.id)}
            </Chip>
          ))}
          {(counts.get(UNSORTED) ?? 0) > 0 && (
            <Chip active={cat === UNSORTED} onClick={() => setParam('c', cat === UNSORTED ? '' : UNSORTED)} quiet>
              Other photos {counts.get(UNSORTED)}
            </Chip>
          )}
        </div>
      )}

      {flat.length === 0 && <p className="text-muted">No photos match.</p>}

      <div className="space-y-10">
        {groups.map((g) => {
          if (budget <= 0) return null
          const visible = g.photos.slice(0, budget)
          budget -= visible.length
          const inParam = g.id ? `?in=${encodeURIComponent(g.id)}` : ''
          return (
            <section key={g.id || 'all'} aria-label={g.label || undefined}>
              {g.label && (
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="min-w-0 text-2xl">{g.label}</h2>
                  <span className="font-sans text-sm text-muted">{g.photos.length}</span>
                  {groups.length > 1 && (
                    <button type="button" className="ml-auto shrink-0 font-sans text-sm font-semibold whitespace-nowrap text-navy hover:underline" onClick={() => setParam('c', g.id)}>
                      Only these &rarr;
                    </button>
                  )}
                </div>
              )}
              {view === 'thumbs' ? (
                <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {visible.map((p) => (
                    <li key={p.id} id={`photo-${p.id}`} className={p.id === focus ? 'relative z-10' : undefined}>
                      <Link
                        to={`/photos/${p.id}${inParam}`}
                        aria-label={p.title}
                        aria-current={p.id === focus ? 'true' : undefined}
                        className={`group relative block aspect-square overflow-hidden rounded-lg bg-paper no-underline ${p.id === focus ? 'ring-4 ring-rose ring-offset-2 ring-offset-paper' : ''}`}
                      >
                        <EncImage path={p.thumb} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent px-2 pt-6 pb-1.5 font-sans text-[0.72rem] leading-tight text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                          {p.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((p) => (
                    <li key={p.id} id={`photo-${p.id}`}>
                      <Link
                        to={`/photos/${p.id}${inParam}`}
                        aria-current={p.id === focus ? 'true' : undefined}
                        className={`card card-hover group block overflow-hidden no-underline ${p.id === focus ? 'ring-4 ring-rose' : ''}`}
                      >
                        <div className="overflow-hidden bg-paper">
                          <EncImage path={p.thumb} alt={p.title} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                        </div>
                        <div className="p-5">
                          <p className="label-caps truncate">
                            {[p.category ? categoryLabel(p.category) : null, p.year, p.place].filter(Boolean).join(' · ') || 'Undated'}
                          </p>
                          <h3 className="mt-1 text-xl">{p.title}</h3>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
      {flat.length > limit && <div ref={sentinel} className="h-10" aria-hidden />}
    </div>
  )
}

function Chip({ active, onClick, children, title, quiet }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string; quiet?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 font-sans text-sm font-semibold transition ${
        active ? 'border-navy bg-navy text-white' : `${quiet ? 'border-dashed' : ''} border-line bg-white text-muted hover:border-navy hover:text-navy`
      }`}
    >
      {children}
    </button>
  )
}
