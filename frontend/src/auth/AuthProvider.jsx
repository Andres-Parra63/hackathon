import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../api/client'
import { AuthContext } from './authContext'

const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

// API user -> session user (keeps the API fields, adds display helpers).
const toSession = (user) => (user ? { ...user, name: user.nombre, initials: initialsOf(user.nombre), role: user.rol } : null)

/**
 * Session against the API: POST /auth/login returns a short-lived JWT, GET /auth/me restores it on reload.
 * `status` is 'checking' while a stored token is validated, then 'ready'.
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() => (getToken() ? 'checking' : 'ready'))

  useEffect(() => {
    if (!getToken()) return
    let alive = true
    api
      .me()
      .then((me) => alive && setUser(toSession(me)))
      .catch(() => setToken(null)) // expired or invalid token: back to signed out
      .finally(() => alive && setStatus('ready'))
    return () => {
      alive = false
    }
  }, [])

  /** Signs in; resolves to the session user, or throws ApiError (wrong credentials, no connection). */
  const login = useCallback(async (email, password) => {
    const session = await api.login(email.trim().toLowerCase(), password)
    setToken(session.token)
    const next = toSession(session.usuario)
    setUser(next)
    return next
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
