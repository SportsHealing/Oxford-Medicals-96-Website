import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.tsx'
import { photos } from '../data/sample.ts'

export default function Gallery() {
  const years = Array.from(new Set(photos.map((p) => p.year))).sort()
  const [year, setYear] = useState<string>('all')
  const shown = year === 'all' ? photos : photos.filter((p) => p.year === year)

  return (
    <div>
      <PageHeader
        eyebrow="The archive"
        title="Photos"
        lede="Open a photo to see who is in it, or to put a name to a face."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        <Chip active={year === 'all'} onClick={() => setYear('all')}>
          All years
        </Chip>
        {years.map((y) => (
          <Chip key={y} active={year === y} onClick={() => setYear(y)}>
            {y}
          </Chip>
        ))}
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((photo) => {
          const confirmed = photo.tags.filter((t) => t.status === 'confirmed').length
          const pending = photo.tags.length - confirmed
          return (
            <li key={photo.id}>
              <Link to={`/photos/${photo.id}`} className="card card-hover group block overflow-hidden no-underline">
                <div className="overflow-hidden">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <p className="label-caps truncate">
                    {photo.year} &middot; {photo.place}
                  </p>
                  <h2 className="mt-1 text-xl">{photo.title}</h2>
                  <p className="mt-3 flex items-center gap-2 font-sans text-sm text-muted">
                    <span className="inline-block h-2 w-2 rounded-full bg-pink" />
                    {confirmed} named
                    {pending > 0 && <span className="text-muted/80">&middot; {pending} to confirm</span>}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 font-sans text-sm font-semibold transition ${
        active ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted hover:border-navy hover:text-navy'
      }`}
    >
      {children}
    </button>
  )
}
