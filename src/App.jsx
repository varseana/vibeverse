import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Lenis from 'lenis'
import { useAuth, ROLES } from './lib/auth.jsx'
import Icon from './components/Icon.jsx'
import PageTransition from './components/PageTransition.jsx'
import GalaxyBackground from './components/GalaxyBackground.jsx'
import FloatingLogo from './components/FloatingLogo.jsx'
import EntryGate from './components/EntryGate.jsx'
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
// Hidden preview of the entry gate (role popup) variants. Lazy so it never
// weighs down the main bundle.
const GateLab = lazy(() => import('./pages/GateLab.jsx'))

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

// Profile chip with a dropdown. For now the only action is logging out (which
// returns to the entry gate). Room to grow (settings, etc.) later.
function ProfileMenu() {
  const { login, role, roleLabel, logout } = useAuth()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])
  const initials = login.slice(0, 2).toUpperCase()
  return (
    <div className="profile-menu">
      <button className="profile-chip" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }} title="Perfil">
        <span className={`profile-avatar ${role}`}>{initials}</span>
        <span className="profile-meta">
          <span className="profile-login">{login}</span>
          <span className={`role-badge ${role}`}>{roleLabel}</span>
        </span>
        <Icon name={open ? 'prev' : 'next'} size={13} />
      </button>
      {open && (
        <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
          <button className="profile-item logout" onClick={logout}>
            <Icon name="external" size={14} /> Cerrar sesion
          </button>
        </div>
      )}
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
  const { isManager, isAdmin, entered } = useAuth()
  const location = useLocation()
  useSmoothScroll()

  const link = (to, name, label, end = false) => (
    <NavLink to={to} end={end}>
      <Icon name={name} size={16} />
      <span>{label}</span>
    </NavLink>
  )

  return (
    <>
    <div className={`app ${entered ? '' : 'gated'}`} aria-hidden={entered ? undefined : 'true'}>
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
        <ProfileMenu />
      </header>

      <main className="content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/calendar" element={<PageTransition><Calendar /></PageTransition>} />
            <Route path="/trivias" element={<PageTransition><Trivias /></PageTransition>} />
            <Route path="/ai-ally" element={<PageTransition><Suspense fallback={<div className="mag-cover"><div className="mag-cover-inner"><div className="skeleton skeleton-fill" /></div></div>}><AiAlly /></Suspense></PageTransition>} />
            <Route path="/monthly-digest" element={<PageTransition><MonthlyDigest /></PageTransition>} />
            {/* Ruta oculta: preview del gate de entrada (sin link en el nav) */}
            <Route path="/gate" element={<PageTransition><Suspense fallback={<div className="empty">Cargando...</div>}><GateLab /></Suspense></PageTransition>} />
            <Route path="/manager-hub" element={<PageTransition><Guard min="manager"><ManagerHub /></Guard></PageTransition>} />
            <Route path="/people" element={<PageTransition><Guard min="manager"><People /></Guard></PageTransition>} />
            <Route path="/admin" element={<PageTransition><Guard min="admin"><Suspense fallback={<div className="empty">Cargando editor...</div>}><Admin /></Suspense></Guard></PageTransition>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>

    {/* Entry gate: blocks all interaction until the user picks a role. The app
        above is already mounted and blurred behind it. */}
    <AnimatePresence>
      {!entered && <EntryGate key="entry-gate" />}
    </AnimatePresence>
    </>
  )
}
