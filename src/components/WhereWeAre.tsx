import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asset } from '../asset.ts'
import type { Member } from '../data/types.ts'

// The map code and outlines load only when someone opens the live map.
const WorldHeatMap = lazy(() => import('./WorldHeatMap.tsx'))

const ALT =
  'Map of known locations of the Oxford Medicine 1996 class: 60 doctors in 36 places in the UK and Ireland, with London (23), Oxford (6) and Leeds (4) the largest, and 9 doctors in 7 places overseas, including Singapore (3), Seattle, Gambia, Wexford, Adelaide, Melbourne and the Gold Coast, plus one cruise ship doctor.'

// "Where are we now" on the members' Home: the organisers' map of known
// locations, and, once members add their towns, a live map from profiles.
export default function WhereWeAre({ people }: { people: Member[] }) {
  const [tab, setTab] = useState<'known' | 'live'>('known')
  const [open, setOpen] = useState(false)
  const [broken, setBroken] = useState(false)
  const hasLive = people.length > 0

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (broken && !hasLive) return null
  const showLive = tab === 'live' || broken

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0 flex-[1_1_16rem]">
          <p className="eyebrow mb-2">Thirty years on</p>
          <h2 className="text-3xl sm:text-4xl">Where are we now</h2>
          <span className="mt-3 block h-[3px] w-12 rounded-full bg-rose" />
        </div>
        {hasLive && !broken && (
          <div role="tablist" aria-label="Which map" className="grid grid-cols-2 rounded-full bg-paper p-1 font-sans text-sm font-semibold">
            {(['known', 'live'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 whitespace-nowrap transition ${tab === t ? 'bg-white text-navy shadow-card' : 'text-muted hover:text-navy'}`}
              >
                {t === 'known' ? 'Known locations' : 'From profiles'}
              </button>
            ))}
          </div>
        )}
      </div>

      {showLive ? (
        <Suspense fallback={<p className="py-10 text-center text-muted">Drawing the map&hellip;</p>}>
          <WorldHeatMap people={people} eyebrow="From members' profiles" />
        </Suspense>
      ) : (
        <figure className="card overflow-hidden">
          <button type="button" onClick={() => setOpen(true)} className="group block w-full cursor-zoom-in" aria-label="See the map larger">
            <img
              src={asset('/known-locations.jpg')}
              srcSet={`${asset('/known-locations-800.jpg')} 800w, ${asset('/known-locations.jpg')} 1448w`}
              sizes="(min-width: 1180px) 1150px, 100vw"
              width={1448}
              height={1086}
              alt={ALT}
              loading="lazy"
              decoding="async"
              onError={() => setBroken(true)}
              className="block h-auto w-full transition duration-300 group-hover:opacity-95"
            />
          </button>
          <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3 font-sans text-sm text-muted">
            <span className="min-w-0 flex-[1_1_14rem]">Where the class is known to be living and working. Tap the map to see it larger.</span>
            <Link to="/classmates?view=map" className="font-semibold text-navy no-underline hover:underline">
              Find people by place &rarr;
            </Link>
          </figcaption>
        </figure>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Map of known locations"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-navy/95 p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <img src={asset('/known-locations.jpg')} alt={ALT} className="max-h-full max-w-full rounded-lg bg-white object-contain shadow-2xl" />
          <button
            type="button"
            autoFocus
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/15 px-4 py-2 font-sans text-sm font-semibold text-white hover:bg-white/30"
          >
            Close
          </button>
        </div>
      )}
    </section>
  )
}
