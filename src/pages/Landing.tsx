import { Link } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'

export default function Landing() {
  const { memberId } = useAuth()

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-12 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="eyebrow mb-4">Oxford Medical School, class of 1996</p>
          <h1 className="text-5xl leading-[1.05] sm:text-6xl">
            Thirty years on.
            <br />
            Still the same faces.
          </h1>
          <p className="lede mt-6 max-w-lg">
            A private place for the 1996 cohort. The old photos, who is in them, and what everyone
            went on to do.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {memberId ? (
              <Link to="/photos" className="btn-primary">
                Browse the photos
              </Link>
            ) : (
              <Link to="/sign-in" className="btn-primary">
                Member sign in
              </Link>
            )}
            <Link to="/privacy" className="btn-outline">
              How your data is handled
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="card flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br from-blush via-white to-white sm:aspect-square">
            <img src={asset('/rita.svg')} alt="Rita the Pink Elephant" className="w-3/5" />
          </div>
          <p className="mt-3 text-center font-serif text-muted italic">Rita, as ever, presiding.</p>
        </div>
      </section>

      <section>
        <p className="eyebrow mb-3">How it works</p>
        <ol className="grid gap-5 md:grid-cols-3">
          <Step n="1" title="Look through the photos" body="From matriculation to graduation, and every Tingewick in between." />
          <Step n="2" title="Put names to faces" body="Suggest who is in a photo. The tag is shown once that person confirms it." />
          <Step n="3" title="Catch up" body="Read what each person wrote about their life since Oxford, then get in touch." />
        </ol>
      </section>

      <section className="card grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          <h2 className="text-2xl">Members only, by design</h2>
          <p className="mt-2 max-w-prose text-muted">
            Nothing beyond this page is public. Photos and profiles are seen only by signed-in
            members of the 1996 cohort, and every tag needs the person&rsquo;s say-so first.
          </p>
        </div>
        <Link to="/privacy" className="btn-quiet justify-self-start md:justify-self-end">
          Read the privacy notice &rarr;
        </Link>
      </section>
    </div>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="card p-6">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy font-serif text-white">
        {n}
      </span>
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mt-1.5 text-muted">{body}</p>
    </li>
  )
}
