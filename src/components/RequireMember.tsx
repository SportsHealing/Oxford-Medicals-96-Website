import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.tsx'

// Phase A: client-side only. Phase B moves this check to the server.
export default function RequireMember() {
  const { email } = useAuth()
  const location = useLocation()
  if (!email) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  return <Outlet />
}
