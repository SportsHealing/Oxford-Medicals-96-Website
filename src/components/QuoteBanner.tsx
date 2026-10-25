import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Link } from 'react-router-dom'
import type { SpeechQuote } from '../data/types.ts'

const SECONDS = 9

// Lines from the reunion speeches, fading one into the next. All quotes sit in
// the same grid cell, so the banner keeps the height of the longest and the
// page does not jump. Pauses on hover, focus, a hidden tab, the Pause button,
// or when the visitor prefers less motion.
export default function QuoteBanner({ quotes }: { quotes: SpeechQuote[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const touchX = useRef<number | null>(null)
  const n = quotes.length
  const go = (d: number) => setIndex((i) => (i + d + n) % n)

  useEffect(() => {
    if (n < 2 || paused || hover || reduced) return
    const t = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % n)
    }, SECONDS * 1000)
    return () => window.clearInterval(t)
  }, [n, paused, hover, reduced])

  if (n === 0) return null
  const current = quotes[index]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Words from the reunion"
      className="relative overflow-hidden rounded-3xl bg-navy px-6 pt-8 pb-5 text-white shadow-card sm:px-12 sm:pt-10"
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
      {/* Drawn rather than typed, so it sits neatly inside the panel at any size. */}
      <svg aria-hidden viewBox="0 0 48 36" className="mb-4 h-7 w-auto text-rose sm:mb-5 sm:h-9">
        <path
          fill="currentColor"
          d="M0 36V22.6C0 9.9 6.2 2.4 18.6 0l2 4.2C13.9 6.3 10.3 10.4 9.8 16.6H19V36H0zm27 0V22.6C27 9.9 33.2 2.4 45.6 0l2 4.2c-6.7 2.1-10.3 6.2-10.8 12.4H46V36H27z"
        />
      </svg>

      <div className="relative grid" aria-live={paused || hover ? 'polite' : 'off'}>
        {quotes.map((q, i) => (
          <figure
            key={q.id}
            aria-hidden={i !== index}
            className={`col-start-1 row-start-1 self-center transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <blockquote className="font-serif text-xl leading-snug text-balance sm:text-[1.7rem]">{q.text}</blockquote>
            <figcaption className="mt-4 font-sans text-sm text-white/70">
              <span className="font-semibold text-rose">{q.attribution}</span>
              <span aria-hidden> &middot; </span>
              <Link to={`/speeches/${q.speechSlug}`} tabIndex={i === index ? 0 : -1} className="text-white/80 underline-offset-4 hover:text-white">
                {q.speechTitle}
              </Link>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <Link to={`/speeches/${current.speechSlug}`} className="font-sans text-sm font-semibold text-white no-underline hover:underline">
          Read the speech &rarr;
        </Link>
        {n > 1 && (
          <div className="ml-auto flex items-center gap-2">
            <RoundButton label="Previous quote" onClick={() => go(-1)} d="M15 5l-7 7 7 7" />
            <span className="min-w-[3.5rem] text-center font-sans text-xs text-white/60" aria-hidden>
              {index + 1} / {n}
            </span>
            <RoundButton label="Next quote" onClick={() => go(1)} d="M9 5l7 7-7 7" />
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
