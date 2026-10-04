import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.tsx'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 font-sans font-semibold no-underline ${
    isActive ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
  }`

export default function Layout() {
  const { email, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-3 text-white no-underline">
            <img src="/rita.svg" alt="" className="h-10 w-10" />
            <span className="font-serif text-2xl leading-none">Oxford Medics 96</span>
          </Link>
          <nav className="flex flex-wrap gap-1 text-base sm:ml-auto">
            {email ? (
              <>
                <NavLink to="/photos" className={navClass}>
                  Photos
                </NavLink>
                <NavLink to="/classmates" className={navClass}>
                  Classmates
                </NavLink>
                <NavLink to="/privacy" className={navClass}>
                  Privacy
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    signOut()
                    navigate('/')
                  }}
                  className="rounded-md px-3 py-1.5 font-sans font-semibold text-rita hover:bg-white/10"
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink to="/sign-in" className={navClass}>
                Member sign in
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <div className="bg-rita px-4 py-1.5 text-center font-sans text-sm text-navy">
        Prototype. Every person and photo shown is a fictional sample.
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-mist">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-sans text-sm text-gray-600">
          <span>oxfordmedics96.com. A private site for the class of 1996.</span>
          <span className="flex gap-4">
            <Link to="/privacy">Privacy</Link>
            <a href="https://tingewick.org" target="_blank" rel="noreferrer">
              Tingewick
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
