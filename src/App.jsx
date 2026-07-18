import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Lenis from 'lenis'
import { useAuth, DEMO_USERS, ROLES } from './lib/auth.jsx'
import Icon from './components/Icon.jsx'
import PageTransition from './components/PageTransition.jsx'
import GalaxyBackground from './components/GalaxyBackground.jsx'
import FloatingLogo from './components/FloatingLogo.jsx'
import logo from './assets/vibe-logo.png'

import Home from './pages/Home.jsx'
import Calendar from './pages/Calendar.jsx'
import Trivias from './pages/Trivias.jsx'
import ManagerHub from './pages/ManagerHub.jsx'
import People from './pages/People.jsx'
import MonthlyDigest from './pages/MonthlyDigest.jsx'

// Code-split: the magazine (pdf.js + flip engine) only loads when a user opens
// this tab, so it never weighs down the rest of the app.
const AiAlly = lazy(() => import('./pages/AiAlly.jsx'))
// Admin carries the heaviest editor (block builder + dnd-kit). Only admins ever
// open it, so lazy-load it to keep the main bundle light for everyone else.
const Admin = lazy(() => import('./pages/Admin.jsx'))

// Route guard: show a friendly notice if the user's rank is below the required.
function Guard({ min, children }) {
  const { can } = useAuth()
  if (min && !can(min)) {
    return (
      <div className="deny">
        <h2>Acceso restringido</h2>
        <p className="muted">Esta seccion es solo para {ROLES[min].label} o superior.</p>
      </div>
    )
  }
  return children
}

function RoleSwitcher() {
  const { login, setLogin, role, roleLabel } = useAuth()
  return (
    <div className="role-switch">
      <span className={`role-badge ${role}`}>{roleLabel}</span>
      <select value={login} onChange={(e) => setLogin(e.target.value)} title="Cambiar de usuario (demo)">
        {DEMO_USERS.map((u) => (
          <option key={u.login} value={u.login}>{u.name}</option>
        ))}
      </select>
    </div>
  )
}

// Smooth "buttery" scrolling via Lenis, wired to requestAnimationFrame.
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    let id
    const raf = (t) => { lenis.raf(t); id = requestAnimationFrame(raf) }
    id = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(id); lenis.destroy() }
  }, [])
}

export default function App() {
  const { isManager, isAdmin } = useAuth()
  const location = useLocation()
  useSmoothScroll()

  const link = (to, name, label, end = false) => (
    <NavLink to={to} end={end}>
      <Icon name={name} size={16} />
      <span>{label}</span>
    </NavLink>
  )

  return (
    <div className="app">
      <GalaxyBackground />
      <FloatingLogo />
      <header className="topbar">
        <div className="brand">
          <img src={logo} alt="VIBE" />
          <div>
            <div className="brand-name">VIBE<span>verse</span></div>
            <div className="brand-slogan">donde todo pasa</div>
          </div>
        </div>
        <nav className="nav">
          {link('/', 'home', 'Inicio', true)}
          {link('/calendar', 'calendar', 'Calendario')}
          {link('/trivias', 'brain', 'Trivias')}
          {link('/ai-ally', 'idea', 'AI is your ally')}
          {link('/monthly-digest', 'news', 'Monthly Digest')}
          {isManager && link('/manager-hub', 'target', 'Manager Hub')}
          {isManager && link('/people', 'cake', 'Cumpleanos')}
          {isAdmin && link('/admin', 'settings', 'Admin')}
        </nav>
        <div className="spacer" />
        <RoleSwitcher />
      </header>

      <main className="content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/calendar" element={<PageTransition><Calendar /></PageTransition>} />
            <Route path="/trivias" element={<PageTransition><Trivias /></PageTransition>} />
            <Route path="/ai-ally" element={<PageTransition><Suspense fallback={<div className="mag-cover"><div className="mag-cover-inner"><div className="skeleton skeleton-fill" /></div></div>}><AiAlly /></Suspense></PageTransition>} />
            <Route path="/monthly-digest" element={<PageTransition><MonthlyDigest /></PageTransition>} />
            <Route path="/manager-hub" element={<PageTransition><Guard min="manager"><ManagerHub /></Guard></PageTransition>} />
            <Route path="/people" element={<PageTransition><Guard min="manager"><People /></Guard></PageTransition>} />
            <Route path="/admin" element={<PageTransition><Guard min="admin"><Suspense fallback={<div className="empty">Cargando editor...</div>}><Admin /></Suspense></Guard></PageTransition>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
