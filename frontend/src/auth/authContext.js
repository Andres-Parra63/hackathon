import { createContext, useContext } from 'react'

export const ROLES = { volunteer: 'voluntario', organization: 'organizacion', admin: 'administrador' }

// Where each role lands after signing in.
export const ROLE_HOME = {
  [ROLES.volunteer]: '/voluntario',
  [ROLES.organization]: '/panel',
  [ROLES.admin]: '/admin',
}

export const AuthContext = createContext({ user: null, status: 'ready', login: async () => null, logout: () => {} })

export const useAuth = () => useContext(AuthContext)
