import { useEffect, useRef, useState } from 'react'
import { asset } from '../asset.ts'
import { foldText } from '../lib/specialties.ts'

export type TownValue = { town: string; country: string; lat: number | null; lng: number | null }
type Place = [name: string, country: string, lat: number, lng: number]

// Loaded the first time someone edits their town (about 60 KB).
let placesPromise: Promise<Place[]> | null = null
const loadPlaces = () => (placesPromise ??= fetch(asset('/geo/places.json')).then((r) => r.json() as Promise<Place[]>))

export default function TownPicker({ value, onChange }: { value: TownValue; onChange: (v: TownValue) => void }) {
  const [places, setPlaces] = useState<Place[] | null>(null)
  const [text, setText] = useState(value.town)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const q = foldText(text.trim())
  const matches = places && q.length >= 2
    ? places
        .filter((p) => foldText(p[0]).startsWith(q))
        .concat(places.filter((p) => !foldText(p[0]).startsWith(q) && foldText(p[0]).includes(q)))
        .slice(0, 8)
    : []

  const pick = (p: Place) => {
    setText(p[0])
    setOpen(false)
    onChange({ town: p[0], country: p[1], lat: p[2], lng: p[3] })
  }

  return (
    <div className="relative" ref={box}>
      <label className="block">
        <span className="label-caps">Town or city where you are now</span>
        <input
          className="field mt-1.5"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls="town-options"
          aria-autocomplete="list"
          value={text}
          placeholder="Start typing, e.g. Leeds"
          onFocus={() => {
            void loadPlaces().then(setPlaces, () => setPlaces([]))
            setOpen(true)
          }}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
            setActive(0)
            // Typed but not picked: kept as text, not placed on the map.
            onChange({ town: e.target.value, country: '', lat: null, lng: null })
          }}
          onKeyDown={(e) => {
            if (!open || matches.length === 0) return
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            else if (e.key === 'Enter') { e.preventDefault(); pick(matches[active]) }
            else if (e.key === 'Escape') setOpen(false)
          }}
        />
      </label>
      {open && matches.length > 0 && (
        <ul id="town-options" role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-card">
          {matches.map((p, i) => (
            <li
              key={`${p[0]}|${p[1]}|${p[2]}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(p) }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-2 font-sans text-sm ${i === active ? 'bg-rose-soft text-navy' : 'text-ink'}`}
            >
              {p[0]} <span className="text-muted">· {p[1]}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 font-sans text-xs text-muted">
        {value.town && value.lat === null
          ? 'Pick a place from the list to appear on the classmates map.'
          : 'Shown on your profile and the classmates map. Leave blank to keep it private.'}
      </p>
    </div>
  )
}
