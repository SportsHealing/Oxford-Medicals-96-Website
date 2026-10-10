import { geoMercator, geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { asset } from '../asset.ts'
import type { Member } from '../data/types.ts'
import Avatar from './Avatar.tsx'

type View = 'uk' | 'world'
type Place = { key: string; town: string; country: string; lat: number; lng: number; people: Member[] }
type Geo = { uk: GeoPermissibleObjects; world: GeoPermissibleObjects }

let geoPromise: Promise<Geo> | null = null
const loadGeo = () =>
  (geoPromise ??= Promise.all([
    fetch(asset('/geo/uk-ie.json')).then((r) => r.json()),
    fetch(asset('/geo/world.json')).then((r) => r.json()),
  ]).then(([uk, world]) => ({ uk, world })))

const SIZE: Record<View, [number, number]> = { uk: [520, 640], world: [960, 500] }
const inUkIe = (p: { lat: number; lng: number }) => p.lat > 49.4 && p.lat < 61.2 && p.lng > -11 && p.lng < 2.2
// Circle sizes in screen pixels, so they stay tappable when the map is narrow.
const radius = (n: number) => 6 + 4 * Math.sqrt(n)

export default function ClassmatesMap({ people }: { people: Member[] }) {
  const [geo, setGeo] = useState<Geo | null>(null)
  const [failed, setFailed] = useState(false)
  const [view, setView] = useState<View>('uk')
  const [selected, setSelected] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [shownWidth, setShownWidth] = useState(0)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setShownWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  })

  useEffect(() => {
    loadGeo().then(setGeo, () => setFailed(true))
  }, [])

  const places = useMemo(() => {
    const byKey = new Map<string, Place>()
    for (const p of people) {
      if (p.lat == null || p.lng == null || !p.town) continue
      const key = `${p.town}|${p.country ?? ''}`
      const place = byKey.get(key) ?? { key, town: p.town, country: p.country ?? '', lat: p.lat, lng: p.lng, people: [] }
      place.people.push(p)
      byKey.set(key, place)
    }
    return [...byKey.values()].sort((a, b) => b.people.length - a.people.length)
  }, [people])

  const placed = places.reduce((n, p) => n + p.people.length, 0)
  const countries = new Set(places.map((p) => p.country)).size
  const notPlaced = people.length - placed
  const elsewhere = places.filter((p) => !inUkIe(p))
  const visible = view === 'uk' ? places.filter(inUkIe) : places
  const current = places.find((p) => p.key === selected) ?? null

  const [w, h] = SIZE[view]
  const projection = useMemo(() => {
    if (!geo) return null
    return view === 'uk'
      ? geoMercator().fitExtent([[12, 12], [w - 12, h - 12]], geo.uk)
      : geoNaturalEarth1().fitExtent([[6, 6], [w - 6, h - 6]], { type: 'Sphere' })
  }, [geo, view, w, h])
  const path = projection ? geoPath(projection) : null
  // Map units per screen pixel.
  const k = shownWidth ? w / shownWidth : 1

  const choose = (p: Place) => {
    if (view === 'uk' && !inUkIe(p)) setView('world')
    setSelected(p.key)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div role="tablist" aria-label="Map area" className="grid grid-cols-2 rounded-full bg-paper p-1 font-sans text-sm font-semibold">
            {(['uk', 'world'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-1.5 transition ${view === v ? 'bg-white text-navy shadow-card' : 'text-muted hover:text-navy'}`}
              >
                {v === 'uk' ? 'UK & Ireland' : 'World'}
              </button>
            ))}
          </div>
          <p className="font-sans text-sm text-muted">
            {placed} {placed === 1 ? 'classmate' : 'classmates'} in {places.length} {places.length === 1 ? 'place' : 'places'}, {countries}{' '}
            {countries === 1 ? 'country' : 'countries'}
          </p>
        </div>

        <div className="bg-mist/40">
          {failed && <p className="p-6 text-muted">The map could not be loaded. The list on the right still works.</p>}
          {!failed && !path && <p className="p-6 text-muted">Drawing the map&hellip;</p>}
          {path && projection && geo && (
            <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" role="img" aria-label={view === 'uk' ? 'Map of the UK and Ireland' : 'World map'}>
              {view === 'world' && <path d={path({ type: 'Sphere' }) ?? ''} className="fill-mist/60" />}
              <path d={path(view === 'uk' ? geo.uk : geo.world) ?? ''} className="fill-white stroke-line" strokeWidth={k} />
              {visible.map((p) => {
                const xy = projection([p.lng, p.lat])
                if (!xy) return null
                const n = p.people.length
                const r = radius(n) * k
                const isSel = p.key === selected
                const label = `${p.town}${p.country && p.country !== 'United Kingdom' ? `, ${p.country}` : ''}: ${n} ${n === 1 ? 'classmate' : 'classmates'}`
                return (
                  <g
                    key={p.key}
                    role="button"
                    tabIndex={0}
                    aria-label={label}
                    aria-pressed={isSel}
                    className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-navy"
                    onClick={() => setSelected(isSel ? null : p.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelected(isSel ? null : p.key)
                      }
                    }}
                  >
                    <title>{label}</title>
                    {/* A larger invisible circle makes small places easy to tap. */}
                    <circle cx={xy[0]} cy={xy[1]} r={Math.max(r, 22 * k)} fill="transparent" />
                    <circle
                      cx={xy[0]}
                      cy={xy[1]}
                      r={r}
                      className={isSel ? 'fill-rose stroke-navy' : 'fill-navy/85 stroke-rose'}
                      strokeWidth={2 * k}
                    />
                    {n > 1 && (
                      <text x={xy[0]} y={xy[1]} dy="0.35em" textAnchor="middle" className={`pointer-events-none font-sans font-semibold ${isSel ? 'fill-navy' : 'fill-white'}`} fontSize={(radius(n) > 14 ? 13 : 11) * k}>
                        {n}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          )}
        </div>
        {view === 'uk' && elsewhere.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 font-sans text-sm">
            <span className="text-muted">Elsewhere:</span>
            {elsewhere.map((p) => (
              <button key={p.key} type="button" onClick={() => choose(p)} className="rounded-full border border-line px-3 py-1 font-semibold text-navy hover:border-navy">
                {p.town} {p.people.length > 1 ? `(${p.people.length})` : ''}
              </button>
            ))}
          </div>
        )}
        <p className="border-t border-line px-4 py-2 font-sans text-xs text-muted">Map: Natural Earth. Places: GeoNames (CC BY 4.0).</p>
      </div>

      <aside className="card self-start p-5">
        {current ? (
          <>
            <button type="button" onClick={() => setSelected(null)} className="font-sans text-sm text-muted hover:text-navy">
              &larr; All places
            </button>
            <h2 className="mt-2 text-2xl">
              {current.town}
              {current.country && current.country !== 'United Kingdom' && <span className="text-muted">, {current.country}</span>}
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {current.people.map((p) => (
                <li key={p.id}>
                  <Link to={`/classmates/${p.id}`} className="flex items-center gap-3 py-2.5 no-underline">
                    <Avatar name={p.name} src={p.avatarUrl} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-sans font-semibold text-navy">{p.name}</span>
                      <span className="block truncate font-sans text-sm text-muted">{p.specialty || p.jobTitle || ''}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h2 className="text-2xl">Where are we now</h2>
            <p className="mt-1 font-sans text-sm text-muted">Tap a circle, or a place below, to see who is there.</p>
            {places.length === 0 ? (
              <p className="mt-4 text-muted">Nobody has added a town yet.</p>
            ) : (
              <ul className="mt-4 max-h-[28rem] divide-y divide-line overflow-y-auto">
                {places.map((p) => (
                  <li key={p.key}>
                    <button type="button" onClick={() => choose(p)} className="flex w-full items-center justify-between gap-3 py-2 text-left font-sans hover:text-navy">
                      <span className="truncate text-ink">
                        {p.town}
                        {p.country && p.country !== 'United Kingdom' && <span className="text-muted">, {p.country}</span>}
                      </span>
                      <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-navy">{p.people.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {notPlaced > 0 && (
              <p className="mt-4 font-sans text-sm text-muted">
                {notPlaced} {notPlaced === 1 ? 'classmate has' : 'classmates have'} not added a town yet.{' '}
                <Link to="/me">Add yours</Link>
              </p>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
