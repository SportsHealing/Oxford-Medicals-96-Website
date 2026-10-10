import { Link } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import PhotoCarousel from '../components/PhotoCarousel.tsx'
import { repo } from '../data/repo.ts'
import { useLoad } from '../lib/useLoad.tsx'

// The members' front page: group photos, then the quickest ways in.
export default function Home() {
  const { memberId, isAdmin } = useAuth()
  const { data } = useLoad(async () => {
    const [featured, me, pending] = await Promise.all([
      repo.listFeaturedPhotos().catch(() => []),
      memberId ? repo.getMember(memberId) : Promise.resolve(null),
      repo.myPendingTags().catch(() => []),
    ])
    const photos = featured.length ? featured : await repo.listHomeFallbackPhotos().catch(() => [])
    return { photos, chosen: featured.length > 0, me, pending: pending.length }
  }, [memberId])

  const first = data?.me?.knownAs || data?.me?.name.split(' ')[0]
  const incomplete = data?.me && repo.hasProfileExtras() && (!data.me.specialty || !data.me.town)

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow">Oxford Medics 96</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">{first ? `Welcome back, ${first}` : 'Welcome back'}</h1>
      </div>

      {data && data.photos.length > 0 && <PhotoCarousel photos={data.photos} />}
      {data && isAdmin && !data.chosen && (
        <p className="font-sans text-sm text-muted">
          Admins: choose the photos shown here by opening a photo and pressing <strong>Feature on Home</strong>.
          Until then, the most-tagged photos are shown.
        </p>
      )}

      {data && (data.pending > 0 || incomplete) && (
        <div className="card flex flex-wrap items-center gap-4 border-rose/60 bg-rose-soft/60 p-5">
          <p className="min-w-0 flex-1 text-ink">
            {data.pending > 0
              ? `${data.pending} photo tag${data.pending === 1 ? '' : 's'} waiting for you to confirm.`
              : 'Add your specialty and town so classmates can find you and see you on the map.'}
          </p>
          <Link to="/me" className="btn-primary !py-2 text-sm">
            {data.pending > 0 ? 'Review tags' : 'Update my profile'}
          </Link>
        </div>
      )}

      <ul className="grid gap-5 sm:grid-cols-3">
        <Tile to="/photos" title="Photos" body="The whole archive, year by year. Put names to faces." />
        <Tile to="/classmates" title="Classmates" body="Find anyone by name, specialty or town." />
        <Tile to="/classmates?view=map" title="Where are we now" body="See where everyone ended up." />
      </ul>
    </div>
  )
}

function Tile({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <li>
      <Link to={to} className="card card-hover block h-full p-6 no-underline">
        <h2 className="text-2xl">{title}</h2>
        <p className="mt-1.5 text-muted">{body}</p>
      </Link>
    </li>
  )
}
