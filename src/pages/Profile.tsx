import { Link, useParams } from 'react-router-dom'
import { personById, photosFeaturing } from '../data/sample.ts'
import NotFound from './NotFound.tsx'

export default function Profile() {
  const { id } = useParams()
  const person = id ? personById(id) : undefined
  if (!person) return <NotFound />
  const inPhotos = photosFeaturing(person.id)

  return (
    <div className="space-y-8">
      <Link to="/classmates" className="font-sans text-sm">
        &larr; All classmates
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">{person.name}</h1>
          <p className="font-sans text-gray-600">
            {person.knownAs ? `Known as ${person.knownAs}. ` : ''}
            {person.college}. Graduated 1996.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {person.linkedin && (
            <a href={person.linkedin} target="_blank" rel="noreferrer" className="btn-outline">
              LinkedIn
            </a>
          )}
          {person.acceptsContact ? (
            <Link to={`/classmates/${person.id}/contact`} className="btn-pink">
              Get in touch
            </Link>
          ) : (
            <span className="btn border border-gray-300 text-gray-500">Not taking contact requests</span>
          )}
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-4 rounded-xl bg-blush p-6">
          <h2 className="text-2xl">Now</h2>
          <Row label="Job">{person.jobTitle}</Row>
          <Row label="Where">{person.workplace}</Row>
          <Row label="Since Oxford">{person.careerPath}</Row>
          <Row label="Outside medicine">{person.interests}</Row>
        </section>

        <section className="space-y-4 rounded-xl bg-mist p-6">
          <h2 className="text-2xl">Then</h2>
          <Row label="Clinical training">{person.clinicalTraining}</Row>
          <Row label="A memory">{person.memory}</Row>
          <Row label="Tingewick">{person.tingewick}</Row>
        </section>
      </div>

      <section>
        <h2 className="text-2xl">In the photos</h2>
        {inPhotos.length === 0 ? (
          <p className="mt-2 text-gray-600">Not tagged in any photos yet.</p>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {inPhotos.map((photo) => (
              <li key={photo.id}>
                <Link to={`/photos/${photo.id}`} className="block no-underline">
                  <img src={photo.src} alt={photo.title} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <span className="mt-1 block font-sans text-sm text-navy">
                    {photo.title}, {photo.year}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="font-sans text-sm text-gray-600">
        Written by {person.name}. Members can edit or remove their own profile at any time.
      </p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-sans text-sm font-semibold uppercase tracking-wide text-navy/70">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  )
}
