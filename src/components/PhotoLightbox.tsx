import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import type { Photo } from '../data/types.ts'

type Props = {
  photos: Photo[]
  startIndex: number
  onClose: (currentId: string) => void
}

const SIDE = 4
const SLOTS = Array.from({ length: SIDE * 2 + 1 }, (_, i) => i - SIDE)

function Arrow({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Previous photo' : 'Next photo'}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 sm:h-12 sm:w-12 ${
        dir === 'prev' ? 'left-3' : 'right-3'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )
}

export default function PhotoLightbox({ photos, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const touchX = useRef<number | null>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<() => void>(() => {})
  const photo = photos[index]

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(photos.length - 1, Math.max(0, i + delta))),
    [photos.length],
  )
  const close = useCallback(() => onClose(photos[index].id), [onClose, photos, index])

  useEffect(() => {
    closeRef.current = close
  }, [close])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, go])

  // Lock page scroll and use the browser's real full screen where it exists
  // (not on iPhone Safari, where the overlay alone fills the screen).
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    void document.documentElement.requestFullscreen?.()?.catch(() => {})
    const onFs = () => {
      if (!document.fullscreenElement) closeRef.current()
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      document.body.style.overflow = prevOverflow
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }, [])

  // Warm the cache for the photos either side so arrows feel instant.
  useEffect(() => {
    for (const d of [-1, 1, 2]) {
      const p = photos[index + d]
      if (p) new Image().src = p.src
    }
  }, [index, photos])

  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.title}, photo ${index + 1} of ${photos.length}`}
    >
      <div className="flex items-center gap-4 px-4 py-3 font-sans">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{photo.title}</p>
          <p className="truncate text-xs text-white/60">
            {[photo.year, photo.place].filter(Boolean).join(' · ')}
            {[photo.year, photo.place].some(Boolean) ? ' · ' : ''}
            {index + 1} of {photos.length}
          </p>
        </div>
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          Close
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {index > 0 && <Arrow dir="prev" onClick={() => go(-1)} />}
        <img key={photo.id} src={photo.src} alt={photo.title} draggable={false} className="max-h-full max-w-full object-contain select-none" />
        {index < photos.length - 1 && <Arrow dir="next" onClick={() => go(1)} />}
      </div>

      <div className="flex justify-center gap-1 px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-1.5" aria-label="Nearby photos">
        {SLOTS.map((offset) => {
          const p = photos[index + offset]
          const slot = 'aspect-square max-w-14 flex-1'
          if (!p) return <span key={offset} className={slot} aria-hidden />
          const current = offset === 0
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => go(offset)}
              aria-label={`Go to ${p.title}`}
              aria-current={current ? 'true' : undefined}
              className={`${slot} overflow-hidden rounded-md bg-white/10 transition ${
                current ? 'opacity-100 ring-2 ring-white' : 'opacity-50 hover:opacity-90'
              }`}
            >
              <img src={p.thumb} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
