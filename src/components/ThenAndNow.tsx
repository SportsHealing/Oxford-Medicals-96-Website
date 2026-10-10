import { useEffect, useState } from 'react'
import { asset } from '../asset.ts'

type Shot = { src: string; srcSet?: string; full: string; width: number; height: number; label: string; caption: string; alt: string }

const SHOTS: Shot[] = [
  {
    src: '/then-1996.jpg',
    full: '/then-1996.jpg',
    width: 600,
    height: 488,
    label: '1996',
    caption: 'Then',
    alt: 'The Oxford medical class of 1996, at the time',
  },
  {
    src: '/landing.jpg',
    srcSet: '/landing-800.jpg 800w, /landing.jpg 1500w',
    full: '/landing.jpg',
    width: 1500,
    height: 1000,
    label: '2026',
    caption: 'Now: back in Oxford, thirty years on',
    alt: 'The Oxford medical class of 1996, together again in Oxford in 2026',
  },
]

// The class then and now, side by side at the same height (each column is
// as wide as its photo's shape). Tap a photo to see it larger.
export default function ThenAndNow() {
  const [broken, setBroken] = useState<string[]>([])
  const [open, setOpen] = useState<Shot | null>(null)
  const shots = SHOTS.filter((s) => !broken.includes(s.src))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (shots.length === 0) return null

  return (
    <>
      <div
        className="grid items-end gap-6 sm:gap-8 md:[grid-template-columns:var(--cols)]"
        style={{ '--cols': shots.map((s) => `${(s.width / s.height).toFixed(3)}fr`).join(' ') } as React.CSSProperties}
      >
        {shots.map((s) => (
          <figure key={s.src}>
            <button
              type="button"
              onClick={() => setOpen(s)}
              aria-label={`See the ${s.label} photo larger`}
              className="group relative block w-full rounded-xl bg-white p-1.5 shadow-2xl transition hover:-translate-y-0.5 sm:p-2"
            >
              <img
                src={asset(s.src)}
                srcSet={s.srcSet?.replace(/\/(\S+)/g, (m) => asset(m))}
                sizes="(min-width: 768px) 600px, 100vw"
                width={s.width}
                height={s.height}
                alt={s.alt}
                onError={() => setBroken((b) => [...b, s.src])}
                className="block h-auto w-full rounded-lg"
              />
              <span className="absolute top-4 right-4 rounded-full bg-navy/80 px-3 py-1 font-sans text-xs font-semibold tracking-wide text-white backdrop-blur">
                {s.label}
              </span>
            </button>
            <figcaption className="mt-3 font-serif text-white/70 italic">{s.caption}</figcaption>
          </figure>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.alt}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-navy/95 p-4"
          onClick={() => setOpen(null)}
        >
          <img src={asset(open.full)} alt={open.alt} className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" />
          <p className="font-serif text-white/80 italic">{open.label}</p>
          <button
            type="button"
            autoFocus
            onClick={() => setOpen(null)}
            className="absolute top-4 right-4 rounded-full bg-white/15 px-4 py-2 font-sans text-sm font-semibold text-white hover:bg-white/30"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
