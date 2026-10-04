import { Link } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'

export default function Landing() {
  const { email } = useAuth()

  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 md:grid-cols-[3fr_2fr]">
        <div className="space-y-5">
          <h1 className="text-5xl leading-tight">Thirty years on. Still the class of 1996.</h1>
          <p className="max-w-prose text-xl text-gray-700">
            A private place for Oxford medics who graduated in 1996. Old photos, familiar faces, and
            what everyone is doing now.
          </p>
          <div className="flex flex-wrap gap-3">
            {email ? (
              <Link to="/photos" className="btn-primary">
                Go to the photos
              </Link>
            ) : (
              <Link to="/sign-in" className="btn-primary">
                Member sign in
              </Link>
            )}
            <Link to="/privacy" className="btn-outline">
              How we look after your data
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-blush p-8 text-center">
          <img src={asset('/rita.svg')} alt="Rita the Pink Elephant" className="mx-auto h-40 w-40" />
          <p className="mt-4 font-serif text-lg text-navy">In Rita we trust.</p>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Feature title="See the photos" body="Matriculation to graduation, and all the Tingewick in between." />
        <Feature title="Put names to faces" body="Tag a classmate. The tag goes live once they confirm it." />
        <Feature title="Find out what happened next" body="Profiles written by each person, in their own words." />
      </section>

      <section className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-2xl">Members only</h2>
        <p className="mt-2 max-w-prose text-gray-700">
          Nothing beyond this page is public. Photos and profiles are visible only to signed-in
          members of the 1996 cohort. If you graduated with us and have not been invited, get in
          touch with the organisers.
        </p>
      </section>
    </div>
  )
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-mist p-5">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-2 text-gray-700">{body}</p>
    </div>
  )
}
