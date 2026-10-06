import { Link } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'

export default function Landing() {
  const { memberId } = useAuth()

  return (
    <div className="-mt-10 space-y-20 sm:-mt-14">
      {/* Full-width navy hero */}
      <section className="relative left-1/2 -ml-[50vw] w-screen overflow-hidden bg-navy text-white">
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-pink/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-10 right-[-6rem] h-96 w-96 rounded-full bg-sky/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-sans text-[0.78rem] font-semibold tracking-[0.12em] text-rita uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-pink" />
              Oxford Medical School, class of 1996
            </p>
            <h1 className="text-5xl leading-[1.05] text-white sm:text-6xl">
              Thirty years on.
              <br />
              <span className="text-pink">Still the same faces.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/80">
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
              <Link to="/privacy" className="btn border border-white/30 text-white hover:border-white hover:bg-white/10">
                How your data is handled
              </Link>
            </div>
          </div>

          <div className="mx-auto w-64 sm:w-80">
            <div className="relative">
              <div className="absolute inset-0 rotate-6 rounded-[2.5rem] bg-sky/40" />
              <div className="absolute inset-0 -rotate-3 rounded-[2.5rem] bg-gold/50" />
              <div className="relative flex aspect-square items-center justify-center rounded-[2.5rem] bg-rita shadow-2xl">
                <img src={asset('/rita.svg')} alt="Rita the Pink Elephant" className="w-3/5 drop-shadow" />
              </div>
            </div>
            <p className="mt-8 text-center font-serif text-white/70 italic">Rita, as ever, presiding.</p>
          </div>
        </div>
      </section>

      <section>
        <p className="eyebrow mb-3">How it works</p>
        <ol className="grid gap-5 md:grid-cols-3">
          <Step n="1" tone="pink" title="Look through the photos" body="From matriculation to graduation, and every Tingewick in between." />
          <Step n="2" tone="gold" title="Put names to faces" body="Suggest who is in a photo. The tag is shown once that person confirms it." />
          <Step n="3" tone="sky" title="Catch up" body="Read what each person wrote about their life since Oxford, then get in touch." />
        </ol>
      </section>

      <section className="grid gap-8 rounded-3xl bg-gold-soft p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          <p className="eyebrow-gold">Private by design</p>
          <h2 className="mt-1 text-2xl">Members only</h2>
          <p className="mt-2 max-w-prose text-ink/80">
            Nothing beyond this page is public. Photos and profiles are seen only by signed-in
            members of the 1996 cohort, and every tag needs the person&rsquo;s say-so first.
          </p>
        </div>
        <Link to="/privacy" className="btn-dark justify-self-start md:justify-self-end">
          Read the privacy notice
        </Link>
      </section>
    </div>
  )
}

const stepTone = {
  pink: { bar: 'bg-pink', num: 'bg-blush text-pink-deep' },
  gold: { bar: 'bg-gold', num: 'bg-gold-soft text-gold-deep' },
  sky: { bar: 'bg-sky', num: 'bg-sky-soft text-sky-deep' },
}

function Step({ n, title, body, tone }: { n: string; title: string; body: string; tone: keyof typeof stepTone }) {
  const t = stepTone[tone]
  return (
    <li className="card card-hover relative overflow-hidden p-6">
      <span className={`absolute inset-x-0 top-0 h-1.5 ${t.bar}`} />
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-serif text-lg font-semibold ${t.num}`}>
        {n}
      </span>
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mt-1.5 text-muted">{body}</p>
    </li>
  )
}
