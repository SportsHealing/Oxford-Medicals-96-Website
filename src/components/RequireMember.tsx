import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import JoinPanel from './JoinPanel.tsx'

// Gate for member-only pages. The real protection is in the database
// (row level security); this just keeps the UI tidy.
export default function RequireMember() {
  const { loading, email, memberId } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="py-20 text-center text-muted">Checking your sign-in&hellip;</p>
  }
  if (!email) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }
  if (!memberId) return <JoinPanel />
  return <Outlet />
}
