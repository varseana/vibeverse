import { createContext, useContext, useState, useEffect } from 'react'
import { ROLE_ALLOWLIST } from '../data/seed.js'

// ---------------------------------------------------------------------------
// Auth / role context
// ---------------------------------------------------------------------------
// In production, the logged-in user comes from Midway SSO and the role comes
// from the /me endpoint (which reads the vibe-roles DynamoDB table). Here we
// mock it: the user can pick who they are via the role switcher so you can
// preview every screen. Default role for anyone not in the allowlist is
// 'collaborator', matching the new "everyone in SEPO gets in" model.
// ---------------------------------------------------------------------------

export const ROLES = {
  collaborator: { label: 'Colaborador', rank: 0 },
  manager: { label: 'Manager', rank: 1 },
  sepo_manager: { label: 'Manager SEPO', rank: 2 },
  admin: { label: 'VIBE Team (Admin)', rank: 3 },
}

// Demo identities you can switch between.
export const DEMO_USERS = [
  { login: 'ana.colab', name: 'Ana (Colaboradora)' },
  { login: 'gacris', name: 'Cristian (Manager)' },
  { login: 'esarriet', name: 'Esteban (Manager SEPO)' },
  { login: 'varseana', name: 'Sean (VIBE Admin)' },
]

export function resolveRole(login) {
  return ROLE_ALLOWLIST[login] || 'collaborator'
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [login, setLogin] = useState(() => localStorage.getItem('vibe_demo_login') || 'ana.colab')

  useEffect(() => {
    localStorage.setItem('vibe_demo_login', login)
  }, [login])

  const role = resolveRole(login)
  const value = {
    login,
    setLogin,
    role,
    roleLabel: ROLES[role].label,
    rank: ROLES[role].rank,
    can: (minRole) => ROLES[role].rank >= ROLES[minRole].rank,
    isAdmin: role === 'admin',
    isSepoManager: role === 'sepo_manager' || role === 'admin',
    isManager: ROLES[role].rank >= ROLES.manager.rank,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
