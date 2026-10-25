import { Suspense } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAccess } from '../access.tsx'
import { asset } from '../asset.ts'
import { Loading } from '../lib/useLoad.tsx'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex shrink-0 items-center gap-2 px-0.5 py-2 font-sans text-[0.9rem] font-semibold no-underline transition after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-full after:transition sm:px-1 sm:text-[0.95rem] ${
    isActive ? 'text-navy after:bg-rose' : 'text-muted after:bg-transparent hover:text-navy hover:after:bg-rose/50'
  }`

export default function Layout() {
  const { status, lock } = useAccess()
  const navigate = useNavigate()
  const open = status === 'open'

  const doLock = () => void lock().then(() => navigate('/'))

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur">
        <div className="border-b border-line">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-5">
            <Link to="/" className="flex shrink-0 items-center gap-3 no-underline" aria-label="Oxford Medics 96, home">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-soft">
                <img src={asset('/rita.svg')} alt="" className="h-8 w-8" />
              </span>
              <span className="hidden font-serif text-[1.35rem] leading-none whitespace-nowrap text-navy sm:inline">
                Oxford Medics <span className="text-rose-deep">96</span>
              </span>
            </Link>

            <nav className="ml-auto flex min-w-0 items-center gap-4 sm:gap-6">
              {open ? (
                <>
                  <NavLink to="/photos" className={navClass}>
                    Photos
                  </NavLink>
                  <NavLink to="/speeches" className={navClass}>
                    Speeches
                  </NavLink>
                  <NavLink to="/map" className={navClass}>
                    <span className="sm:hidden">Map</span>
                    <span className="hidden sm:inline">Where we are</span>
                  </NavLink>
                </>
              ) : (
                <NavLink to="/photos" className="btn-primary !py-2 text-sm">
                  View photos
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="bg-navy text-white/75">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 font-sans text-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <img src={asset('/rita.svg')} alt="" className="h-6 w-6" />
              </span>
              <span>
                <span className="font-serif text-base text-white">Oxford Medics 96</span>
                <span className="ml-2 hidden sm:inline">A private site for the class of 1996.</span>
              </span>
            </div>
            <div className="flex items-center gap-5">
              <Link to="/privacy" className="text-white/75 no-underline hover:text-white">
                Privacy
              </Link>
              {open && (
                <button type="button" onClick={doLock} className="text-white/75 hover:text-white" title="Forget the class code on this device">
                  Lock
                </button>
              )}
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 text-xs">
            Website by Indi Gupte, powered by{' '}
            <a href="https://www.sportshealing.com/" target="_blank" rel="noreferrer" className="text-white no-underline hover:text-white hover:underline">
              SportsHealing Technologies
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
