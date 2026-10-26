import { Navigate, Outlet, useLocation } from 'react-router-dom'
import es from '../i18n/es'
import { ROLE_HOME, useAuth } from './authContext'

/** Route guard: no session -> /ingreso; wrong role -> that role's own home. Waits while the token is checked. */
export default function RequireRole({ role }) {
  const { user, status } = useAuth()
  const location = useLocation()
  if (status === 'checking') {
    return (
      <p className="auth-checking t-body c-muted" role="status">
        {es.loadState.session}
      </p>
    )
  }
  if (!user) return <Navigate to="/ingreso" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />
  return <Outlet />
}
