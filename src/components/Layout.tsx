import { Suspense } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'
import { repo } from '../data/repo.ts'
import { Loading, useLoad } from '../lib/useLoad.tsx'
import Avatar from './Avatar.tsx'
import PasswordPrompt from './PasswordPrompt.tsx'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex shrink-0 items-center gap-2 px-0.5 py-2 font-sans text-[0.82rem] font-semibold sm:px-1 sm:text-[0.95rem] no-underline transition after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-full after:transition ${
    isActive ? 'text-navy after:bg-rose' : 'text-muted after:bg-transparent hover:text-navy hover:after:bg-rose/50'
  }`

export default function Layout() {
  const { email, memberId, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Re-read on entering and leaving the Me page, where the picture changes.
  const onMe = pathname === '/me'
  const { data: me } = useLoad(() => (memberId ? repo.getMember(memberId) : Promise.resolve(null)), [memberId, onMe])

  const doSignOut = () => void signOut().then(() => navigate('/'))

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur">
        <div className="border-b border-line">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3 sm:gap-6 sm:px-5">
            <Link to="/" className="flex shrink-0 items-center gap-3 no-underline" aria-label="Oxford Medics 96, home">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-soft sm:h-10 sm:w-10">
                <img src={asset('/rita.svg')} alt="" className="h-8 w-8" />
              </span>
              <span className="hidden font-serif text-[1.35rem] leading-none whitespace-nowrap text-navy lg:inline">
                Oxford Medics <span className="text-rose-deep">96</span>
              </span>
            </Link>

            <nav className="ml-auto flex min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden">
              {email ? (
                <>
                  {memberId && (
                    <>
                      {/* On phones the logo is the way Home, to leave room for the rest. */}
                      <span className="hidden sm:flex">
                        <NavLink to="/" end className={navClass}>
                          Home
                        </NavLink>
                      </span>
                      <NavLink to="/photos" className={navClass}>
                        Photos
                      </NavLink>
                      <NavLink to="/classmates" className={navClass}>
                        Classmates
                      </NavLink>
                      <NavLink to="/speeches" className={navClass}>
                        Speeches
                      </NavLink>
                      <NavLink to="/me" className={navClass}>
                        <Avatar name={me?.name ?? email} src={me?.avatarUrl} size="xs" />
                        <span className="hidden sm:inline">Me</span>
                      </NavLink>
                      {isAdmin && (
                        <span className="hidden lg:flex">
                          <NavLink to="/admin" className={navClass}>
                            Admin
                          </NavLink>
                        </span>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={doSignOut}
                    className="hidden shrink-0 rounded-full border border-line px-4 py-1.5 font-sans text-sm font-semibold text-muted transition hover:border-navy hover:text-navy lg:inline-flex"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <NavLink to="/sign-in" className="btn-primary !py-2 text-sm">
                  Sign in or join
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
              {isAdmin && (
                <Link to="/admin" className="text-white/75 no-underline hover:text-white lg:hidden">
                  Admin
                </Link>
              )}
              <Link to="/privacy" className="text-white/75 no-underline hover:text-white">
                Privacy
              </Link>
              {email && (
                <button type="button" onClick={doSignOut} className="text-white/75 hover:text-white lg:hidden">
                  Sign out
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

      <PasswordPrompt />
    </div>
  )
}
