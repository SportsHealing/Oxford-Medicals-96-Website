import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { AiSortPanel, MoveBar } from '../components/SortTools.tsx'
import { repo } from '../data/repo.ts'
import type { Photo } from '../data/types.ts'
import { PHOTO_CATEGORIES, categoryLabel } from '../lib/photoCategories.ts'
import { foldText } from '../lib/specialties.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'

// Thumbnails are drawn in pages as the visitor scrolls, so 800 photos open quickly.
const PAGE = { thumbs: 120, large: 36 }
const UNSORTED = 'unsorted'

type Group = { id: string; label: string; photos: Photo[] }

export default function Gallery() {
  const { isAdmin } = useAuth()
  const { data: photos, loading, error, reload } = useLoad(() => repo.listPhotos(), [])
  const [params, setParams] = useSearchParams()
  const cat = params.get('c') ?? ''
  const year = params.get('y') ?? ''
  const view: 'thumbs' | 'large' = params.get('view') === 'large' ? 'large' : 'thumbs'
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [sorting, setSorting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const lastClicked = useRef<string | null>(null)

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
  const hasCats = !loading && repo.hasPhotoCategories()
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of all) {
      const k = p.category || UNSORTED
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [all])
  const years = useMemo(() => Array.from(new Set(all.map((p) => p.year).filter(Boolean) as string[])).sort(), [all])

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
            label: id === UNSORTED ? 'Not sorted yet' : categoryLabel(id),
            photos: shown.filter((p) => (p.category || UNSORTED) === id),
          }))
          .filter((g) => g.photos.length > 0)
      : [{ id: cat, label: '', photos: shown }]
  const flat = groups.flatMap((g) => g.photos)

  if (loading) return <Loading what="Fetching the photos" />
  if (error) return <LoadError message={error} />

  const toggle = (id: string, e: MouseEvent) => {
    e.preventDefault()
    const anchor = e.shiftKey ? lastClicked.current : null
    lastClicked.current = id
    setSelected((prev) => {
      const next = new Set(prev)
      // Shift-click selects everything between this photo and the last one clicked.
      if (anchor) {
        const a = flat.findIndex((p) => p.id === anchor)
        const b = flat.findIndex((p) => p.id === id)
        if (a >= 0 && b >= 0) {
          for (const p of flat.slice(Math.min(a, b), Math.max(a, b) + 1)) next.add(p.id)
          return next
        }
      }
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const unsorted = counts.get(UNSORTED) ?? 0
  let budget = limit

  return (
    <div className={sorting && selected.size > 0 ? 'pb-28' : ''}>
      <PageHeader
        eyebrow="The archive"
        title="Photos"
        lede={`${all.length} photos. Open one to see who is in it, or to put a name to a face.`}
        actions={
          <>
            {isAdmin && hasCats && all.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSorting((v) => !v)
                  setSelected(new Set())
                }}
                className={sorting ? 'btn-dark' : 'btn-outline'}
                aria-pressed={sorting}
              >
                {sorting ? 'Done sorting' : 'Sort photos'}
              </button>
            )}
            <Link to="/photos/new" className="btn-primary">
              + Add photos
            </Link>
          </>
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
          {sorting && (
            <AiSortPanel
              unsorted={unsorted}
              onProgress={reload}
              onPickUnsorted={() => setParam('c', UNSORTED)}
            />
          )}

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
              {PHOTO_CATEGORIES.filter((c) => counts.get(c.id) || sorting).map((c) => (
                <Chip key={c.id} active={cat === c.id} onClick={() => setParam('c', cat === c.id ? '' : c.id)} title={c.hint}>
                  {c.label} {counts.get(c.id) ?? 0}
                </Chip>
              ))}
              {unsorted > 0 && (
                <Chip active={cat === UNSORTED} onClick={() => setParam('c', cat === UNSORTED ? '' : UNSORTED)} quiet>
                  Not sorted yet {unsorted}
                </Chip>
              )}
            </div>
          )}

          {sorting && (
            <p className="mb-4 font-sans text-sm text-muted">
              Tap photos to select them (hold Shift to select a run), then choose where they go at the bottom of the screen.
              Photos marked <span className="rounded bg-navy/80 px-1 text-[0.7rem] font-semibold text-white">AI</span> were sorted by
              the AI; moving one marks it as checked.
            </p>
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
                      {g.photos.length > visible.length || groups.length > 1 ? (
                        <button type="button" className="ml-auto shrink-0 font-sans text-sm font-semibold whitespace-nowrap text-navy hover:underline" onClick={() => setParam('c', g.id)}>
                          Only these &rarr;
                        </button>
                      ) : null}
                    </div>
                  )}
                  {view === 'thumbs' ? (
                    <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                      {visible.map((p) => (
                        <Thumb key={p.id} photo={p} to={`/photos/${p.id}${inParam}`} sorting={sorting} selected={selected.has(p.id)} onToggle={toggle} />
                      ))}
                    </ul>
                  ) : (
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {visible.map((p) => (
                        <Card key={p.id} photo={p} to={`/photos/${p.id}${inParam}`} sorting={sorting} selected={selected.has(p.id)} onToggle={toggle} />
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
          {flat.length > limit && <div ref={sentinel} className="h-10" aria-hidden />}

          {sorting && selected.size > 0 && (
            <MoveBar
              count={selected.size}
              onSelectAll={() => setSelected(new Set(flat.map((p) => p.id)))}
              onClear={() => setSelected(new Set())}
              onMove={async (category) => {
                await repo.setPhotoCategory([...selected], category)
                setSelected(new Set())
                reload()
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

type TileProps = { photo: Photo; to: string; sorting: boolean; selected: boolean; onToggle: (id: string, e: MouseEvent) => void }

function Thumb({ photo, to, sorting, selected, onToggle }: TileProps) {
  const named = photo.tags.filter((t) => t.status === 'confirmed').length
  return (
    <li>
      <Link
        to={to}
        onClick={sorting ? (e) => onToggle(photo.id, e) : undefined}
        aria-pressed={sorting ? selected : undefined}
        aria-label={photo.title}
        className={`group relative block aspect-square overflow-hidden rounded-lg bg-paper no-underline outline-offset-2 ${
          selected ? 'ring-4 ring-rose ring-offset-2' : ''
        }`}
      >
        <img
          src={photo.thumb}
          alt=""
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition duration-300 ${sorting ? '' : 'group-hover:scale-105'} ${selected ? 'opacity-80' : ''}`}
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent px-2 pt-6 pb-1.5 font-sans text-[0.72rem] leading-tight text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          {photo.title}
        </span>
        {named > 0 && !sorting && (
          <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold text-navy">
            <span className="h-1.5 w-1.5 rounded-full bg-rose" />
            {named}
          </span>
        )}
        {sorting && <SortMarks photo={photo} selected={selected} />}
      </Link>
    </li>
  )
}

function Card({ photo, to, sorting, selected, onToggle }: TileProps) {
  const confirmed = photo.tags.filter((t) => t.status === 'confirmed').length
  const pending = photo.tags.filter((t) => t.status === 'pending').length
  return (
    <li>
      <Link
        to={to}
        onClick={sorting ? (e) => onToggle(photo.id, e) : undefined}
        aria-pressed={sorting ? selected : undefined}
        className={`card card-hover group relative block overflow-hidden no-underline ${selected ? 'ring-4 ring-rose' : ''}`}
      >
        <div className="relative overflow-hidden bg-paper">
          <img
            src={photo.thumb}
            alt={photo.title}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          {sorting && <SortMarks photo={photo} selected={selected} />}
        </div>
        <div className="p-5">
          <p className="label-caps truncate">
            {[photo.category ? categoryLabel(photo.category) : null, photo.year, photo.place].filter(Boolean).join(' · ') || 'Undated'}
          </p>
          <h3 className="mt-1 text-xl">{photo.title}</h3>
          <p className="mt-3 flex items-center gap-2 font-sans text-sm text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-rose" />
            {confirmed} named
            {pending > 0 && <span className="text-muted/80">&middot; {pending} to confirm</span>}
          </p>
        </div>
      </Link>
    </li>
  )
}

function SortMarks({ photo, selected }: { photo: Photo; selected: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={`absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-card ${
          selected ? 'bg-rose text-navy' : 'bg-navy/30'
        }`}
      >
        {selected && (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
      {photo.categorySource === 'ai' && (
        <span className="absolute bottom-1.5 left-1.5 rounded bg-navy/80 px-1 font-sans text-[0.65rem] font-semibold text-white">AI</span>
      )}
    </>
  )
}

function Chip({
  active,
  onClick,
  children,
  title,
  quiet,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
  quiet?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 font-sans text-sm font-semibold transition ${
        active
          ? 'border-navy bg-navy text-white'
          : `${quiet ? 'border-dashed' : ''} border-line bg-white text-muted hover:border-navy hover:text-navy`
      }`}
    >
      {children}
    </button>
  )
}

