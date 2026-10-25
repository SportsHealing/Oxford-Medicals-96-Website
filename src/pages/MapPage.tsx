import { useEffect, useState } from 'react'
import { asset } from '../asset.ts'
import PageHeader from '../components/PageHeader.tsx'

const ALT =
  'Map of known locations of the Oxford Medicine 1996 class: 60 doctors in 36 places in the UK and Ireland, with London (23), Oxford (6) and Leeds (4) the largest, and 9 doctors in 7 places overseas, including Singapore (3), Seattle, Gambia, Wexford, Adelaide, Melbourne and the Gold Coast, plus one cruise ship doctor.'

// The organisers' map of where the class is known to be. Tap to enlarge.
export default function MapPage() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div>
      <PageHeader eyebrow="Thirty years on" title="Where are we now" lede="Where the class is known to be living and working, as far as the organisers know. Tap the map to see it larger." />
      <figure className="card overflow-hidden">
        <button type="button" onClick={() => setOpen(true)} className="group block w-full cursor-zoom-in" aria-label="See the map larger">
          <img
            src={asset('/known-locations.jpg')}
            srcSet={`${asset('/known-locations-800.jpg')} 800w, ${asset('/known-locations.jpg')} 1448w`}
            sizes="(min-width: 1180px) 1150px, 100vw"
            width={1448}
            height={1086}
            alt={ALT}
            decoding="async"
            className="block h-auto w-full transition duration-300 group-hover:opacity-95"
          />
        </button>
        <figcaption className="border-t border-line px-5 py-3 font-sans text-sm text-muted">
          Moved, or not on the map? Tell one of the organisers and it will be updated.
        </figcaption>
      </figure>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Map of known locations" className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-navy/95 p-3 sm:p-6" onClick={() => setOpen(false)}>
          <img src={asset('/known-locations.jpg')} alt={ALT} className="max-h-full max-w-full rounded-lg bg-white object-contain shadow-2xl" />
          <button type="button" autoFocus onClick={() => setOpen(false)} className="absolute top-4 right-4 rounded-full bg-white/15 px-4 py-2 font-sans text-sm font-semibold text-white hover:bg-white/30">
            Close
          </button>
        </div>
      )}
    </div>
  )
}
