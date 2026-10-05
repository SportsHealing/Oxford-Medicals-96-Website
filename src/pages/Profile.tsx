import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar.tsx'
import { personById, photosFeaturing } from '../data/sample.ts'
import NotFound from './NotFound.tsx'

export default function Profile() {
  const { id } = useParams()
  const person = id ? personById(id) : undefined
  if (!person) return <NotFound />
  const inPhotos = photosFeaturing(person.id)

  return (
    <div>
      <Link to="/classmates" className="mb-6 inline-block font-sans text-sm text-muted no-underline hover:text-navy">
        &larr; All classmates
      </Link>

      <header className="flex flex-wrap items-center gap-6">
        <Avatar name={person.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl">{person.name}</h1>
          <p className="mt-1 font-sans text-muted">
            {person.knownAs ? `Known as ${person.knownAs} · ` : ''}
            {person.college} · Graduated 1996
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {person.linkedin && (
            <a href={person.linkedin} target="_blank" rel="noreferrer" className="btn-outline">
              LinkedIn
            </a>
          )}
          {person.acceptsContact ? (
            <Link to={`/classmates/${person.id}/contact`} className="btn-primary">
              Get in touch
            </Link>
          ) : (
            <span className="btn cursor-default border border-line text-muted">Not taking messages</span>
          )}
        </div>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="card p-7">
          <p className="eyebrow">Now</p>
          <p className="mt-2 font-serif text-2xl text-navy">{person.jobTitle}</p>
          <p className="font-sans text-muted">{person.workplace}</p>
          <dl className="mt-6 space-y-5">
            <Row label="Since Oxford">{person.careerPath}</Row>
            <Row label="Outside medicine">{person.interests}</Row>
          </dl>
        </section>

        <section className="card p-7">
          <p className="eyebrow">Then</p>
          <dl className="mt-4 space-y-5">
            <Row label="Clinical training">{person.clinicalTraining}</Row>
            <Row label="A memory">{person.memory}</Row>
            <Row label="Tingewick">{person.tingewick}</Row>
          </dl>
        </section>
      </div>

      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl">In the photos</h2>
          <Link to="/photos" className="font-sans text-sm text-muted no-underline hover:text-navy">
            All photos &rarr;
          </Link>
        </div>
        {inPhotos.length === 0 ? (
          <p className="text-muted">Not tagged in any photos yet.</p>
        ) : (
          <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {inPhotos.map((photo) => (
              <li key={photo.id}>
                <Link to={`/photos/${photo.id}`} className="card card-hover block overflow-hidden no-underline">
                  <img src={photo.src} alt={photo.title} className="aspect-[4/3] w-full object-cover" />
                  <span className="block px-4 py-3">
                    <span className="label-caps">{photo.year}</span>
                    <span className="block font-sans text-[0.95rem] text-navy">{photo.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-12 font-sans text-sm text-muted">
        Written by {person.name}. Members can edit or remove their own profile at any time.
      </p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  )
}
