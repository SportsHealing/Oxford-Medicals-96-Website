import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.tsx'

// Gate for member-only pages. The real protection is in the database
// (row level security); this just keeps the UI tidy.
export default function RequireMember() {
  const { loading, email, isMember, signOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="py-20 text-center text-muted">Checking your sign-in&hellip;</p>
  }
  if (!email) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }
  if (!isMember) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="eyebrow">Not on the list yet</p>
        <h1 className="mt-2 text-3xl">We don&rsquo;t recognise {email}</h1>
        <p className="mt-3 text-muted">
          This site is for Oxford medics who graduated in 1996. If that&rsquo;s you, ask the
          organisers to add this address to the members list, or sign in with the address they
          invited.
        </p>
        <button type="button" className="btn-outline mt-6" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    )
  }
  return <Outlet />
}
