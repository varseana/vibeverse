import { createContext, useContext, useState, useEffect } from 'react'
import { ROLE_ALLOWLIST, RR_MANAGERS } from '../data/seed.js'

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

// Maps a gate choice (collaborator / manager / admin) to a demo login. When the
// real backend lands, the gate's login/register replaces this and the resolved
// role comes from Midway + the vibe-roles table instead of a demo identity.
const GATE_LOGIN = {
  collaborator: 'ana.colab',
  manager: 'esarriet',
  admin: 'varseana',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [login, setLogin] = useState(() => localStorage.getItem('vibe_demo_login') || 'ana.colab')
  // Whether the entry gate has been passed. Persisted so it only shows once per
  // browser until the user logs out.
  const [entered, setEntered] = useState(() => localStorage.getItem('vibe_gate_entered') === '1')

  useEffect(() => {
    localStorage.setItem('vibe_demo_login', login)
  }, [login])

  useEffect(() => {
    localStorage.setItem('vibe_gate_entered', entered ? '1' : '0')
  }, [entered])

  // Enter the app as a gate role (collaborator goes straight in; manager/admin
  // arrive here after the mock login).
  const enterAs = (roleKey) => {
    setLogin(GATE_LOGIN[roleKey] || GATE_LOGIN.collaborator)
    setEntered(true)
  }

  // Log out: drop back to the gate.
  const logout = () => {
    setEntered(false)
    setLogin('ana.colab')
  }

  const role = resolveRole(login)
  const value = {
    login,
    setLogin,
    entered,
    enterAs,
    logout,
    role,
    roleLabel: ROLES[role].label,
    rank: ROLES[role].rank,
    can: (minRole) => ROLES[role].rank >= ROLES[minRole].rank,
    isAdmin: role === 'admin',
    isSepoManager: role === 'sepo_manager' || role === 'admin',
    isManager: ROLES[role].rank >= ROLES.manager.rank,
    // Only the small R&R team can see/manage Rewards & Recognition (all
    // nominations, delivery, amounts). Independent of the admin role.
    isRewardsManager: RR_MANAGERS.includes(login),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
