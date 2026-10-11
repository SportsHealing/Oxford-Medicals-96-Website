import { geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { asset } from '../asset.ts'
import type { Member } from '../data/types.ts'

type Place = { key: string; label: string; lat: number; lng: number; n: number }

const W = 960
const H = 500

let worldPromise: Promise<GeoPermissibleObjects> | null = null
const loadWorld = () => (worldPromise ??= fetch(asset('/geo/world.json')).then((r) => r.json()))

// Sizes are in screen pixels, so the glow reads the same on a phone and a desktop.
const glowRadius = (n: number) => 14 + 12 * Math.sqrt(n)
const coreRadius = (n: number) => 3 + 1.6 * Math.sqrt(n)

// A world map where each town glows; more classmates, bigger and brighter glow.
// Overlapping glows add up, so clusters (London, Oxford) read as hot spots.
export default function WorldHeatMap({ people, eyebrow = 'Where are we now' }: { people: Member[]; eyebrow?: string }) {
  const [world, setWorld] = useState<GeoPermissibleObjects | null>(null)
  const [failed, setFailed] = useState(false)
  const [hover, setHover] = useState<{ place: Place; x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [shownWidth, setShownWidth] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    loadWorld().then(setWorld, () => setFailed(true))
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setShownWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  })

  const places = useMemo(() => {
    const byKey = new Map<string, Place>()
    for (const p of people) {
      if (p.lat == null || p.lng == null || !p.town) continue
      const key = `${p.town}|${p.country ?? ''}`
      const label = p.country && p.country !== 'United Kingdom' ? `${p.town}, ${p.country}` : p.town
      const place = byKey.get(key) ?? { key, label, lat: p.lat, lng: p.lng, n: 0 }
      place.n++
      byKey.set(key, place)
    }
    // Biggest last, so its core dot sits on top.
    return [...byKey.values()].sort((a, b) => a.n - b.n)
  }, [people])

  const projection = useMemo(() => geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], { type: 'Sphere' }), [])
  const path = geoPath(projection)
  // Crop to the inhabited latitudes (no Antarctica, little Arctic), so the map is not too tall.
  const top = projection([0, 78])?.[1] ?? 0
  const bottom = projection([0, -56])?.[1] ?? H
  const viewH = bottom - top
  const k = shownWidth ? W / shownWidth : 1

  const placed = places.reduce((s, p) => s + p.n, 0)
  const countries = new Set(people.filter((p) => p.lat != null && p.town).map((p) => p.country ?? '')).size
  if (places.length === 0) return null

  return (
    <section className="overflow-hidden rounded-3xl bg-navy text-white shadow-card">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 px-6 pt-6 sm:px-8 sm:pt-8">
        <div className="min-w-0 flex-[1_1_16rem]">
          <p className="font-sans text-[0.78rem] font-semibold tracking-[0.14em] text-rose uppercase">{eyebrow}</p>
          <h2 className="mt-1 text-3xl text-white sm:text-4xl">
            {placed} {placed === 1 ? 'classmate' : 'classmates'}, {countries} {countries === 1 ? 'country' : 'countries'}
          </h2>
        </div>
        <Link to="/classmates?view=map" className="font-sans text-sm font-semibold text-white no-underline hover:underline">
          Open the full map &rarr;
        </Link>
      </div>

      <div ref={wrapRef} className="relative px-2 pb-2 sm:px-4 sm:pb-4">
        {failed && <p className="p-6 text-white/70">The map could not be loaded.</p>}
        {!failed && (
          <svg
            ref={svgRef}
            viewBox={`0 ${top} ${W} ${viewH}`}
            className="block h-auto w-full"
            role="img"
            aria-label={`World map of where classmates live: ${[...places].reverse().map((p) => `${p.label} ${p.n}`).join(', ')}`}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <radialGradient id="heat-glow">
                <stop offset="0%" stopColor="var(--color-rose)" stopOpacity="0.85" />
                <stop offset="45%" stopColor="var(--color-rose)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-rose)" stopOpacity="0" />
              </radialGradient>
            </defs>
            {world && <path d={path(world) ?? ''} fill="var(--color-navy-soft)" fillOpacity={0.55} stroke="var(--color-navy)" strokeWidth={0.6 * k} />}
            {places.map((p) => {
              const xy = projection([p.lng, p.lat])
              if (!xy) return null
              return <circle key={`g-${p.key}`} cx={xy[0]} cy={xy[1]} r={glowRadius(p.n) * k} fill="url(#heat-glow)" className="pointer-events-none" />
            })}
            {places.map((p) => {
              const xy = projection([p.lng, p.lat])
              if (!xy) return null
              const show = () => {
                const box = svgRef.current?.getBoundingClientRect()
                const wrap = wrapRef.current?.getBoundingClientRect()
                if (box && wrap) {
                  setHover({ place: p, x: box.left - wrap.left + (xy[0] / W) * box.width, y: box.top - wrap.top + ((xy[1] - top) / viewH) * box.height })
                }
              }
              const label = `${p.label}: ${p.n} ${p.n === 1 ? 'classmate' : 'classmates'}`
              return (
                <g
                  key={p.key}
                  role="link"
                  tabIndex={0}
                  aria-label={label}
                  className="cursor-pointer outline-none"
                  onMouseEnter={show}
                  onFocus={show}
                  onBlur={() => setHover(null)}
                  onClick={() => navigate('/classmates?view=map')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate('/classmates?view=map')
                  }}
                >
                  {/* Bigger than the dot, so small places are easy to hover and tap. */}
                  <circle cx={xy[0]} cy={xy[1]} r={Math.max(coreRadius(p.n), 12) * k} fill="transparent" />
                  <circle
                    cx={xy[0]}
                    cy={xy[1]}
                    r={coreRadius(p.n) * k}
                    fill={hover?.place.key === p.key ? 'white' : 'var(--color-rose)'}
                    stroke="var(--color-navy)"
                    strokeWidth={2 * k}
                  />
                </g>
              )
            })}
          </svg>
        )}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-white px-3 py-1.5 font-sans text-sm whitespace-nowrap text-ink shadow-card"
            style={{ left: hover.x, top: hover.y - 10 }}
          >
            <span className="font-semibold text-navy">{hover.place.label}</span> &middot; {hover.place.n}{' '}
            {hover.place.n === 1 ? 'classmate' : 'classmates'}
          </div>
        )}
      </div>
    </section>
  )
}
