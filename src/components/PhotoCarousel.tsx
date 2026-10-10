import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Photo } from '../data/types.ts'

const SECONDS = 7

// Slow crossfade between a few photos. Pauses on hover, keyboard focus, a
// hidden tab, the Pause button, or when the visitor prefers less motion.
export default function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const touchX = useRef<number | null>(null)
  const n = photos.length
  const go = (d: number) => setIndex((i) => (i + d + n) % n)

  useEffect(() => {
    if (n < 2 || paused || hover || reduced) return
    const t = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % n)
    }, SECONDS * 1000)
    return () => window.clearInterval(t)
  }, [n, paused, hover, reduced])

  if (n === 0) return null
  const current = photos[index]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Group photos"
      className="relative overflow-hidden rounded-3xl bg-navy shadow-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onTouchStart={(e: TouchEvent) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e: TouchEvent) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/9]">
        {photos.map((p, i) => (
          <Link
            key={p.id}
            to={`/photos/${p.id}`}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className={`absolute inset-0 block transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <img src={p.thumb} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
            <img
              src={p.src}
              alt={p.title}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              decoding="async"
              className="relative h-full w-full object-contain"
            />
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-navy px-4 py-3 text-white sm:px-6">
        <div className="min-w-0 flex-1" aria-live={paused || hover ? 'polite' : 'off'}>
          <p className="truncate font-serif text-lg">{current.title}</p>
          <p className="truncate font-sans text-sm text-white/70">{[current.year, current.place].filter(Boolean).join(' · ')}</p>
        </div>
        {n > 1 && (
          <div className="flex items-center gap-2">
            <RoundButton label="Previous photo" onClick={() => go(-1)} d="M15 5l-7 7 7 7" />
            <div className="flex gap-1.5 px-1">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Show ${p.title}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${i === index ? 'bg-rose' : 'bg-white/35 hover:bg-white/70'}`}
                />
              ))}
            </div>
            <RoundButton label="Next photo" onClick={() => go(1)} d="M9 5l7 7-7 7" />
            {!reduced && (
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                className="ml-1 rounded-full border border-white/30 px-3 py-1 font-sans text-xs font-semibold hover:border-white"
              >
                {paused ? 'Play' : 'Pause'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function RoundButton({ label, onClick, d }: { label: string; onClick: () => void; d: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d} />
      </svg>
    </button>
  )
}
