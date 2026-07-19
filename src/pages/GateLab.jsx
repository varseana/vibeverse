import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Icon from '../components/Icon.jsx'
import GalaxyBackground from '../components/GalaxyBackground.jsx'
import logo from '../assets/vibe-logo.png'

// ---------------------------------------------------------------------------
// GateLab: gate de entrada, Variante C (mundo central + lunas, transicion warp).
// La pagina real carga detras (mock difuminado); el overlay BLOQUEA hasta que
// el usuario elige rol. Investigador entra directo; Manager y VIBE pasan por
// login mock (admin / admin).
//
// Mezcla pedida: cuerpo GIGANTE GASEOSO (feTurbulence) + halo pulsante y anillo
// punteado giratorio (del estilo orbe). El logo de VIBE va pequeno al centro
// del planeta morado (admin). Todo procedural/local, sin red ni imagenes
// externas. El selector de arriba ofrece VARIACIONES de la mezcla.
//
// Colores: investigador = azul, manager = naranja, VIBE = morado.
// ---------------------------------------------------------------------------

const ROLES = [
  {
    key: 'collaborator', title: 'Soy investigador', tag: 'Entra directo',
    desc: 'Explora noticias, eventos, trivias y el Monthly Digest de SEPO.',
    needsLogin: false,
    c1: '#7cc4ff', c2: '#2563eb', c3: '#0a2a6b', glow: 'rgba(59,130,246,0.55)',
  },
  {
    key: 'manager', title: 'Soy manager', tag: 'Login / registro',
    desc: 'Ademas: Manager Hub, cumpleanos del equipo y Rewards and Recognition.',
    needsLogin: true,
    c1: '#ffc07a', c2: '#f97316', c3: '#7c2d12', glow: 'rgba(249,115,22,0.55)',
  },
  {
    key: 'admin', title: 'Soy miembro de VIBE', tag: 'Login / registro',
    desc: 'Back office completo: editar todo el contenido y publicar el digest.',
    needsLogin: true,
    c1: '#D1A0E2', c2: '#9F86D7', c3: '#4b2170', glow: 'rgba(159,134,215,0.6)',
  },
]

// ---------------------------------------------------------------------------
// La esfera: cuerpo de gigante gaseoso + halo pulsante + anillo(s) punteado(s).
// `variant` ajusta la mezcla:
//   soft   -> pulso suave, 1 anillo punteado
//   strong -> pulso marcado, 2 anillos (uno solido tenue + uno punteado)
//   rings  -> pulso suave, doble anillo punteado contrarrotante
// `logoMode`: 'admin' (solo el planeta morado lleva logo) | 'all' | 'none'.
// ---------------------------------------------------------------------------
function GasSphere({ role, size = 190, variant = 'strong', logoMode = 'admin', spin = true }) {
  const id = 'gs_' + role.key
  const showLogo = logoMode === 'all' || (logoMode === 'admin' && role.key === 'admin')
  const logoSize = Math.round(size * 0.26)
  return (
    <div className={`gl-gas-wrap ${variant}`} style={{ width: size, height: size }}>
      {/* halo pulsante (del orbe) */}
      <span className="gl-gas-halo" style={{ background: `radial-gradient(circle, ${role.glow}, transparent 68%)` }} />

      <svg width={size} height={size} viewBox="0 0 200 200" className="gl-gas-svg">
        <defs>
          <filter id={`${id}_bands`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency="0.006 0.09" numOctaves="4" seed="12" result="bands" />
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4" result="warp" />
            <feDisplacementMap in="bands" in2="warp" scale="26" xChannelSelector="R" yChannelSelector="G" result="sw" />
            <feColorMatrix in="sw" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 -0.1" />
          </filter>
          <radialGradient id={`${id}_base`} cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor={role.c1} />
            <stop offset="58%" stopColor={role.c2} />
            <stop offset="100%" stopColor={role.c3} />
          </radialGradient>
          <radialGradient id={`${id}_sh`} cx="34%" cy="30%" r="66%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>
          <clipPath id={`${id}_clip`}><circle cx="100" cy="100" r="70" /></clipPath>
        </defs>

        {/* anillo solido tenue (solo en strong) */}
        {variant === 'strong' && (
          <circle cx="100" cy="100" r="88" fill="none" stroke={role.c1} strokeWidth="1.5" opacity="0.4" className="gl-gas-ring-solid" />
        )}

        {/* cuerpo gigante gaseoso, girando */}
        <g className={spin ? 'gl-gas-body' : ''} style={{ transformOrigin: '100px 100px' }}>
          <circle cx="100" cy="100" r="70" fill={`url(#${id}_base)`} />
          <g clipPath={`url(#${id}_clip)`}>
            <rect x="30" y="30" width="140" height="140" fill={role.c1} filter={`url(#${id}_bands)`} opacity="0.5" />
          </g>
          <circle cx="100" cy="100" r="70" fill={`url(#${id}_sh)`} />
        </g>

        {/* anillo(s) punteado(s) del orbe */}
        <circle cx="100" cy="100" r="84" fill="none" stroke={role.c1} strokeWidth="1.5" opacity="0.6" strokeDasharray="3 10" className="gl-gas-ring1" style={{ transformOrigin: '100px 100px' }} />
        {(variant === 'rings') && (
          <circle cx="100" cy="100" r="94" fill="none" stroke={role.c2} strokeWidth="1" opacity="0.45" strokeDasharray="2 12" className="gl-gas-ring2" style={{ transformOrigin: '100px 100px' }} />
        )}
      </svg>

      {/* logo VIBE al centro, girando junto con el planeta (solo morado por defecto) */}
      {showLogo && (
        <img src={logo} alt="VIBE" className={`gl-gas-logo ${spin ? 'spin' : ''}`} style={{ width: logoSize, height: logoSize }} />
      )}
    </div>
  )
}

const VARIATIONS = [
  { key: 'strong', label: 'Pulso marcado + anillo solido', hint: 'Halo fuerte, anillo tenue + anillo punteado.' },
  { key: 'soft', label: 'Pulso suave', hint: 'Halo suave y un solo anillo punteado.' },
  { key: 'rings', label: 'Doble anillo punteado', hint: 'Dos anillos punteados contrarrotantes.' },
]
const LOGO_MODES = [
  { key: 'admin', label: 'Logo solo en VIBE (morado)' },
  { key: 'all', label: 'Logo en los tres' },
  { key: 'none', label: 'Sin logo' },
]

// Blurred fake page behind the gate.
function MockPageBehind() {
  return (
    <div className="gl-behind" aria-hidden="true">
      <div className="gl-behind-topbar">
        <div className="gl-behind-brand">VIBE<span>verse</span></div>
        <div className="gl-behind-nav">
          {['Inicio', 'Calendario', 'Trivias', 'AI is your ally', 'Monthly Digest'].map((t) => <span key={t}>{t}</span>)}
        </div>
      </div>
      <div className="gl-behind-hero" />
      <div className="gl-behind-grid">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="gl-behind-card" />)}
      </div>
    </div>
  )
}

// Mock login (admin / admin).
function LoginPanel({ variant, logoMode, role, onBack, onDone }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    if (user === 'admin' && pass === 'admin') onDone()
    else setErr(true)
  }
  return (
    <motion.form
      className="gl-login" onSubmit={submit}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    >
      <div className="gl-login-planet"><GasSphere role={role} size={92} variant={variant} logoMode={logoMode} spin={false} /></div>
      <h3>{role.title}</h3>
      <p className="muted">Ingresa para continuar. Demo: usuario <strong>admin</strong>, clave <strong>admin</strong>.</p>
      <label>Usuario</label>
      <input value={user} onChange={(e) => { setUser(e.target.value); setErr(false) }} placeholder="admin" autoFocus />
      <label>Contrasena</label>
      <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(false) }} placeholder="admin" />
      {err && <div className="gl-login-err"><Icon name="clock" size={13} /> Usuario o clave incorrectos (usa admin / admin).</div>}
      <div className="gl-login-actions">
        <button type="button" className="btn ghost" onClick={onBack}><Icon name="prev" size={14} /> Volver</button>
        <button type="submit" className="btn">Entrar <Icon name="next" size={14} /></button>
      </div>
    </motion.form>
  )
}

// Variante C: mundo central + lunas. Transicion: warp.
function GateC({ variant, logoMode, onEnter }) {
  const [login, setLogin] = useState(null)
  const [warp, setWarp] = useState(false)
  const [hover, setHover] = useState(null)
  const pick = (role) => { if (role.needsLogin) setLogin(role); else launch(role) }
  const launch = (role) => { setWarp(true); setTimeout(() => onEnter(role.key), 820) }
  const shown = hover || ROLES[0]

  return (
    <div className={`gl-moons ${warp ? 'warp' : ''}`}>
      <AnimatePresence mode="wait">
        {login ? (
          <LoginPanel key="login" variant={variant} logoMode={logoMode} role={login} onBack={() => setLogin(null)} onDone={() => launch(login)} />
        ) : (
          <motion.div key="pick" className="gl-moons-stage" initial={{ opacity: 0 }} animate={{ opacity: warp ? 0 : 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <div className="gl-head"><h1>Bienvenido a VIBEverse</h1><p>Toca una luna para elegir tu rol.</p></div>
            <div className="gl-moons-system">
              <div className="gl-moons-core"><GasSphere role={shown} size={210} variant={variant} logoMode={logoMode} /></div>
              {ROLES.map((role, i) => (
                <button
                  key={role.key}
                  className={`gl-moon m${i} ${shown.key === role.key ? 'sel' : ''}`}
                  onMouseEnter={() => setHover(role)}
                  onFocus={() => setHover(role)}
                  onClick={() => pick(role)}
                  title={role.title}
                >
                  <GasSphere role={role} size={70} variant={variant} logoMode={logoMode} spin={false} />
                  <span className="gl-moon-label">{role.title}</span>
                </button>
              ))}
            </div>
            <div className="gl-moons-info">
              <span className="gl-tagline" style={{ color: shown.c1 }}>{shown.tag}</span>
              <strong>{shown.title}</strong>
              <p className="muted">{shown.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {warp && <div className="gl-warp-flash" />}
    </div>
  )
}

export default function GateLab() {
  const [variant, setVariant] = useState('rings')
  const [logoMode, setLogoMode] = useState('admin')
  const [entered, setEntered] = useState(null)
  const curVar = VARIATIONS.find((v) => v.key === variant) || VARIATIONS[0]

  useEffect(() => {
    if (entered) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [entered, variant, logoMode])

  return (
    <div className="gl-page">
      <div className="gl-controls">
        <div className="gl-tabs">
          {VARIATIONS.map((v) => (
            <button key={v.key} className={`gl-tab ${variant === v.key ? 'active' : ''}`} onClick={() => { setVariant(v.key); setEntered(null) }}>{v.label}</button>
          ))}
        </div>
        {entered && <button className="btn ghost sm" onClick={() => setEntered(null)}><Icon name="prev" size={13} /> Ver el gate otra vez</button>}
      </div>
      <div className="gl-controls" style={{ marginBottom: 10 }}>
        <div className="gl-tabs">
          {LOGO_MODES.map((m) => (
            <button key={m.key} className={`gl-tab ${logoMode === m.key ? 'active' : ''}`} onClick={() => { setLogoMode(m.key); setEntered(null) }}>{m.label}</button>
          ))}
        </div>
      </div>
      <div className="gl-controls-hint notice">
        <Icon name="idea" size={15} />
        <span>Gigante gaseoso + halo pulsante y anillo punteado. Variacion: <strong>{curVar.label}</strong>. {curVar.hint} Azul = investigador, naranja = manager, morado = VIBE (con logo).</span>
      </div>

      <div className="gl-viewport">
        <div className={`gl-stage-bg ${entered ? 'clear' : 'blurred'}`}>
          <GalaxyBackground />
          <MockPageBehind />
        </div>

        <AnimatePresence>
          {!entered && (
            <motion.div key={variant + logoMode} className="gl-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <GateC variant={variant} logoMode={logoMode} onEnter={(k) => setEntered(k)} />
            </motion.div>
          )}
        </AnimatePresence>

        {entered && (
          <motion.div className="gl-entered-note" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Icon name="sparkles" size={16} /> Entraste como <strong>{ROLES.find((r) => r.key === entered)?.title}</strong>. La pagina ya es interactuable.
          </motion.div>
        )}
      </div>
    </div>
  )
}
