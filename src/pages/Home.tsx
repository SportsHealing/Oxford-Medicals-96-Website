import { Link } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import PhotoCarousel from '../components/PhotoCarousel.tsx'
import QuoteBanner from '../components/QuoteBanner.tsx'
import SpeechCard from '../components/SpeechCard.tsx'
import ThenAndNow from '../components/ThenAndNow.tsx'
import { repo } from '../data/repo.ts'
import { useLoad } from '../lib/useLoad.tsx'

// The members' front page: the class then and now, words from the reunion,
// then the quickest ways into the rest of the site.
export default function Home() {
  const { memberId, isAdmin } = useAuth()
  const { data } = useLoad(async () => {
    const [featured, me, pending, quotes, speeches] = await Promise.all([
      repo.listFeaturedPhotos().catch(() => []),
      memberId ? repo.getMember(memberId) : Promise.resolve(null),
      repo.myPendingTags().catch(() => []),
      repo.listSpeechQuotes().catch(() => []),
      repo.listSpeeches().catch(() => []),
    ])
    return { featured, me, pending: pending.length, quotes, speeches }
  }, [memberId])

  const first = data?.me?.knownAs || data?.me?.name.split(' ')[0]
  const incomplete = data?.me && repo.hasProfileExtras() && (!data.me.specialty || !data.me.town)

  return (
    <div className="-mt-10 space-y-12 sm:-mt-14 sm:space-y-16">
      {/* Full-width navy band, as on the public front page */}
      <section className="relative left-1/2 -ml-[50vw] w-screen overflow-hidden bg-navy text-white">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-rose/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <p className="mb-3 font-sans text-[0.78rem] font-semibold tracking-[0.14em] text-rose uppercase">
            Oxford Medics 96 &middot; Thirty years on
          </p>
          <h1 className="text-4xl leading-tight text-white sm:text-5xl">{first ? `Welcome back, ${first}` : 'Welcome back'}</h1>
          <p className="mt-3 max-w-xl text-lg text-white/75">The class of 1996, then and now.</p>
          <div className="mt-10">
            <ThenAndNow />
          </div>
        </div>
      </section>

      {data && data.quotes.length > 0 && <QuoteBanner quotes={data.quotes} />}

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

      {data && data.speeches.length > 0 && (
        <section>
          <p className="eyebrow mb-2">The reunion dinner</p>
          <h2 className="text-3xl sm:text-4xl">The speeches</h2>
          <span className="mt-3 mb-6 block h-[3px] w-12 rounded-full bg-rose" />
          <ul className="grid gap-5 sm:grid-cols-2">
            {data.speeches.map((s) => (
              <SpeechCard key={s.id} speech={s} />
            ))}
          </ul>
        </section>
      )}

      {data && data.featured.length > 0 && (
        <section>
          <p className="eyebrow mb-2">Chosen by the organisers</p>
          <h2 className="mb-6 text-3xl sm:text-4xl">From the archive</h2>
          <PhotoCarousel photos={data.featured} />
        </section>
      )}
      {data && isAdmin && data.featured.length === 0 && (
        <p className="font-sans text-sm text-muted">
          Admins: to add a slideshow of archive photos here, open a photo and press <strong>Feature on Home</strong>.
        </p>
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
