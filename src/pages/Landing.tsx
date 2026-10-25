import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccess } from '../access.tsx'
import { asset } from '../asset.ts'
import QuoteBanner from '../components/QuoteBanner.tsx'
import { listQuotes } from '../data/archive.ts'
import { useLoad } from '../lib/useLoad.tsx'

export default function Landing() {
  const { status } = useAccess()
  const open = status === 'open'
  // Lines from the reunion speeches, once the code has been entered.
  const { data: quotes } = useLoad(() => (open ? listQuotes() : Promise.resolve([])), [open])
  // The class photo, if it has been added to the site; otherwise Rita.
  const [photoOk, setPhotoOk] = useState(true)
  const [thenOk, setThenOk] = useState(true)

  return (
    <div className="-mt-10 space-y-20 sm:-mt-14">
      {/* Full-width navy hero */}
      <section className="relative left-1/2 -ml-[50vw] w-screen overflow-hidden bg-navy text-white">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-rose/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 md:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="mb-5 font-sans text-[0.78rem] font-semibold tracking-[0.14em] text-rose uppercase">
              Oxford Medical School &middot; Class of 1996
            </p>
            <h1 className="text-5xl leading-[1.05] text-white sm:text-6xl">
              Thirty years on.
              <br />
              <span className="text-rose">Still the same faces.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/75">
              A private place for the 1996 cohort: the old photos, the reunion speeches, and where
              everyone ended up.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/photos" className="btn-primary">
                {open ? 'Browse the photos' : 'View photos'}
              </Link>
              <Link to="/privacy" className="btn border border-white/25 text-white hover:border-white/60 hover:bg-white/5">
                How your data is handled
              </Link>
            </div>
          </div>

          {photoOk ? (
            <figure className="md:-mr-6">
              <div className="relative">
                <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl border border-rose/40" />
                <img
                  src={asset('/landing.jpg')}
                  srcSet={`${asset('/landing-800.jpg')} 800w, ${asset('/landing.jpg')} 1500w`}
                  sizes="(min-width: 768px) 560px, 100vw"
                  width={1500}
                  height={1000}
                  alt="The Oxford medical class of 1996, together again in Oxford"
                  fetchPriority="high"
                  onError={() => setPhotoOk(false)}
                  className="relative aspect-[3/2] w-full rounded-3xl bg-navy-soft object-cover shadow-2xl"
                />
                <span className="absolute top-3 right-3 rounded-full bg-navy/80 px-3 py-1 font-sans text-xs font-semibold tracking-wide text-white backdrop-blur">
                  2026
                </span>
                {thenOk && (
                  // The same class thirty years earlier, laid on top like an old print.
                  <div className="absolute -bottom-10 -left-3 w-[44%] -rotate-[4deg] rounded-md bg-white p-1.5 pb-1 shadow-2xl sm:-left-8 sm:w-[40%]">
                    <img
                      src={asset('/then-1996.jpg')}
                      width={600}
                      height={488}
                      alt="The Oxford medical class of 1996, thirty years earlier"
                      onError={() => setThenOk(false)}
                      className="block h-auto w-full rounded-sm"
                    />
                    <p className="py-0.5 text-center font-serif text-sm text-navy italic sm:text-base">1996</p>
                  </div>
                )}
              </div>
              <figcaption className={`${thenOk ? 'mt-4 pl-[48%] text-left text-sm sm:mt-14 sm:pl-[38%] sm:text-base' : 'mt-6 text-center'} font-serif text-white/60 italic`}>
                Back in Oxford, thirty years on.
              </figcaption>
            </figure>
          ) : (
            <div className="mx-auto w-60 sm:w-72">
              <div className="relative">
                <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.25rem] border border-rose/40" />
                <div className="relative flex aspect-square items-center justify-center rounded-[2.25rem] bg-rose-soft shadow-2xl">
                  <img src={asset('/rita.svg')} alt="Rita the Pink Elephant" className="w-3/5" />
                </div>
              </div>
              <p className="mt-8 text-center font-serif text-white/60 italic">Rita, as ever, presiding.</p>
            </div>
          )}
        </div>
      </section>

      {open && quotes && quotes.length > 0 && <QuoteBanner quotes={quotes} />}

      <section>
        <p className="eyebrow mb-3">{open ? 'Inside' : "What's inside"}</p>
        <ol className="grid gap-5 md:grid-cols-3">
          <Step n="1" to="/photos" title="The photos" body="Hundreds of pictures from matriculation to graduation and every Tingewick in between, sorted by occasion." />
          <Step n="2" to="/speeches" title="The speeches" body="Words from the reunion dinner and the years before, to read, view or download." />
          <Step n="3" to="/map" title="Where are we now" body="A map of where the class is known to be living and working, thirty years on." />
        </ol>
      </section>

      <section className="grid gap-8 rounded-3xl bg-stone p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          <p className="eyebrow-stone">Private by design</p>
          <h2 className="mt-1 text-2xl">For the class of 1996</h2>
          <p className="mt-2 max-w-prose text-ink/80">
            Nothing beyond this page is public. The photos and speeches open only with the class code,
            and they are stored in scrambled form that the code alone can unscramble. Please keep the
            code within the year group.
          </p>
        </div>
        <Link to="/privacy" className="btn-dark justify-self-start md:justify-self-end">
          Read the privacy notice
        </Link>
      </section>
    </div>
  )
}

function Step({ n, to, title, body }: { n: string; to: string; title: string; body: string }) {
  return (
    <li>
      <Link to={to} className="card card-hover block h-full p-6 no-underline">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy font-serif text-lg text-rose">{n}</span>
        <h3 className="mt-4 text-xl">{title}</h3>
        <p className="mt-1.5 text-muted">{body}</p>
      </Link>
    </li>
  )
}
