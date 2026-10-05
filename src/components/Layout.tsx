import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { asset } from '../asset.ts'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative px-1 py-2 font-sans text-[0.95rem] font-semibold no-underline transition after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:transition ${
    isActive ? 'text-navy after:bg-pink' : 'text-muted after:bg-transparent hover:text-navy hover:after:bg-rita'
  }`

export default function Layout() {
  const { email, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <img src={asset('/rita.svg')} alt="" className="h-9 w-9" />
            <span className="font-serif text-[1.15rem] leading-none whitespace-nowrap text-navy sm:text-[1.35rem]">
              Oxford Medics <span className="text-pink-deep">96</span>
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-4 sm:gap-5">
            {email ? (
              <>
                <NavLink to="/photos" className={navClass}>
                  Photos
                </NavLink>
                <NavLink to="/classmates" className={navClass}>
                  Classmates
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    signOut()
                    navigate('/')
                  }}
                  className="hidden rounded-full border border-line px-4 py-1.5 font-sans text-sm font-semibold text-muted transition hover:border-navy hover:text-navy sm:inline-flex"
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink to="/sign-in" className="btn-primary !py-2 text-sm">
                Member sign in
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 font-sans text-sm text-muted">
          <div className="flex items-center gap-3">
            <img src={asset('/rita.svg')} alt="" className="h-6 w-6 opacity-80" />
            <span>oxfordmedics96.com. A private site for the class of 1996.</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs font-semibold text-pink-deep">
              Prototype with sample data
            </span>
            <Link to="/privacy" className="text-muted no-underline hover:text-navy">
              Privacy
            </Link>
            {email && (
              <button
                type="button"
                onClick={() => {
                  signOut()
                  navigate('/')
                }}
                className="text-muted hover:text-navy sm:hidden"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
