import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import Avatar from '../components/Avatar.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'
import NotFound from './NotFound.tsx'

export default function Profile() {
  const { id = '' } = useParams()
  const { memberId } = useAuth()
  const { data, loading, error } = useLoad(
    async () => {
      const [person, photos] = await Promise.all([repo.getMember(id), repo.listPhotos()])
      return { person, photos }
    },
    [id],
  )

  if (loading) return <Loading what="Opening the profile" />
  if (error) return <LoadError message={error} />
  if (!data?.person) return <NotFound />
  const { person, photos } = data
  const isMe = person.id === memberId
  const inPhotos = photos.filter((p) =>
    p.tags.some((t) => t.memberId === person.id && (t.status === 'confirmed' || isMe)),
  )
  const hasNow = person.jobTitle || person.workplace || person.careerPath || person.interests
  const hasThen = person.clinicalTraining || person.memory || person.tingewick

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
            {person.college ? `${person.college} · ` : ''}
            Graduated 1996
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isMe ? (
            <Link to="/me" className="btn-primary">
              Edit my profile
            </Link>
          ) : (
            <>
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
            </>
          )}
        </div>
      </header>

      {!hasNow && !hasThen ? (
        <div className="card mt-10 p-8 text-center">
          <p className="text-muted">
            {isMe ? 'Your profile is empty. ' : `${person.name} has not filled in their profile yet.`}
            {isMe && (
              <Link to="/me" className="ml-1">
                Fill it in now.
              </Link>
            )}
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="card p-7">
            <p className="eyebrow">Now</p>
            {person.jobTitle && <p className="mt-2 font-serif text-2xl text-navy">{person.jobTitle}</p>}
            {person.workplace && <p className="font-sans text-muted">{person.workplace}</p>}
            <dl className="mt-6 space-y-5">
              {person.careerPath && <Row label="Since Oxford">{person.careerPath}</Row>}
              {person.interests && <Row label="Outside medicine">{person.interests}</Row>}
            </dl>
          </section>

          <section className="card p-7">
            <p className="eyebrow">Then</p>
            <dl className="mt-4 space-y-5">
              {person.clinicalTraining && <Row label="Clinical training">{person.clinicalTraining}</Row>}
              {person.memory && <Row label="A memory">{person.memory}</Row>}
              {person.tingewick && <Row label="Tingewick">{person.tingewick}</Row>}
            </dl>
          </section>
        </div>
      )}

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
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {inPhotos.map((photo) => (
              <li key={photo.id}>
                <Link to={`/photos/${photo.id}`} className="card card-hover block overflow-hidden no-underline">
                  <img src={photo.src} alt={photo.title} className="aspect-[4/3] w-full object-cover" />
                  <span className="block px-4 py-3">
                    <span className="label-caps">{photo.year ?? 'Undated'}</span>
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
