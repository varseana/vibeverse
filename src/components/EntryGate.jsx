import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../lib/auth.jsx'
import Icon from './Icon.jsx'
import logo from '../assets/vibe-logo.png'

// ---------------------------------------------------------------------------
// EntryGate: popup de entrada real (Variante C: mundo central + lunas, warp).
// La app ya esta montada y viva DETRAS; este overlay la bloquea hasta que el
// usuario elige rol. Investigador entra directo; Manager y VIBE pasan por login
// mock (admin / admin). Al entrar, llama a auth.enterAs(rol) y se desvanece.
//
// Esfera: gigante gaseoso (feTurbulence) + halo pulsante + doble anillo punteado
// contrarrotante. El logo de VIBE gira con el planeta morado (admin). Todo
// procedural/local, sin red. Se muestra una sola vez (persistido en auth) hasta
// hacer logout. Cuando llegue Midway, el login mock se cambia por SSO.
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

// Gas-giant sphere + pulsing halo + double dotted counter-rotating ring, and
// the VIBE logo spinning with the purple planet (admin only).
function GasSphere({ role, size = 210, spin = true }) {
  const id = 'eg_' + role.key
  const showLogo = role.key === 'admin'
  const logoSize = Math.round(size * 0.26)
  return (
    <div className="gl-gas-wrap rings" style={{ width: size, height: size }}>
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
        <g className={spin ? 'gl-gas-body' : ''} style={{ transformOrigin: '100px 100px' }}>
          <circle cx="100" cy="100" r="70" fill={`url(#${id}_base)`} />
          <g clipPath={`url(#${id}_clip)`}>
            <rect x="30" y="30" width="140" height="140" fill={role.c1} filter={`url(#${id}_bands)`} opacity="0.5" />
          </g>
          <circle cx="100" cy="100" r="70" fill={`url(#${id}_sh)`} />
        </g>
        <circle cx="100" cy="100" r="84" fill="none" stroke={role.c1} strokeWidth="1.5" opacity="0.6" strokeDasharray="3 10" className="gl-gas-ring1" style={{ transformOrigin: '100px 100px' }} />
        <circle cx="100" cy="100" r="94" fill="none" stroke={role.c2} strokeWidth="1" opacity="0.45" strokeDasharray="2 12" className="gl-gas-ring2" style={{ transformOrigin: '100px 100px' }} />
      </svg>
      {showLogo && (
        <img src={logo} alt="VIBE" className={`gl-gas-logo ${spin ? 'spin' : ''}`} style={{ width: logoSize, height: logoSize }} />
      )}
    </div>
  )
}

function LoginPanel({ role, onBack, onDone }) {
  // phase: 'login' (form) | 'reset' (recuperar clave) | 'auth' (ingresando...)
  const [phase, setPhase] = useState('login')
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState(false)
  const [resetTo, setResetTo] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (user === 'admin' && pass === 'admin') {
      // animacion de "ingresando" antes de disparar la transicion (warp).
      setPhase('auth')
      setTimeout(() => onDone(), 1100)
    } else {
      setErr(true)
    }
  }

  const sendReset = (e) => {
    e.preventDefault()
    setResetSent(true)
  }

  // Estado "ingresando": el planeta crece y brilla, barra shimmer de progreso.
  if (phase === 'auth') {
    return (
      <motion.div
        className="gl-login gl-login-auth"
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      >
        <motion.div
          className="gl-login-planet"
          animate={{ scale: [1, 1.14, 1.06], filter: ['brightness(1)', 'brightness(1.35)', 'brightness(1.2)'] }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        >
          <GasSphere role={role} size={104} spin />
        </motion.div>
        <h3>Ingresando</h3>
        <p className="muted">Preparando tu VIBEverse, {role.title.replace('Soy ', '')}.</p>
        <div className="gl-auth-bar"><span /></div>
      </motion.div>
    )
  }

  // Estado "recuperar contrasena".
  if (phase === 'reset') {
    return (
      <motion.form
        className="gl-login" onSubmit={sendReset}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      >
        <div className="gl-login-planet"><GasSphere role={role} size={84} spin={false} /></div>
        <h3>Restablecer contrasena</h3>
        {resetSent ? (
          <>
            <p className="muted">Si existe una cuenta para <strong>{resetTo || 'ese usuario'}</strong>, te enviamos un enlace para restablecer la contrasena. Revisa tu correo de Amazon.</p>
            <div className="gl-login-note"><Icon name="idea" size={13} /> Demo: sin backend todavia, el envio es simulado. Usa admin / admin para entrar.</div>
            <div className="gl-login-actions">
              <button type="button" className="btn" onClick={() => { setPhase('login'); setResetSent(false); setResetTo('') }}>Volver al ingreso</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Ingresa tu usuario o correo y te enviaremos un enlace para restablecerla.</p>
            <label>Usuario o correo</label>
            <input value={resetTo} onChange={(e) => setResetTo(e.target.value)} placeholder="tu-alias o tu-alias@amazon.com" autoFocus />
            <div className="gl-login-actions">
              <button type="button" className="btn ghost" onClick={() => setPhase('login')}><Icon name="prev" size={14} /> Volver</button>
              <button type="submit" className="btn" disabled={!resetTo.trim()}>Enviar enlace <Icon name="next" size={14} /></button>
            </div>
          </>
        )}
      </motion.form>
    )
  }

  // Estado normal: formulario de ingreso.
  return (
    <motion.form
      className="gl-login" onSubmit={submit}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    >
      <div className="gl-login-planet"><GasSphere role={role} size={92} spin={false} /></div>
      <h3>{role.title}</h3>
      <p className="muted">Ingresa para continuar. Demo: usuario <strong>admin</strong>, clave <strong>admin</strong>.</p>
      <label>Usuario</label>
      <input value={user} onChange={(e) => { setUser(e.target.value); setErr(false) }} placeholder="admin" autoFocus />
      <label>Contrasena</label>
      <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(false) }} placeholder="admin" />
      {err && <div className="gl-login-err"><Icon name="clock" size={13} /> Usuario o clave incorrectos (usa admin / admin).</div>}
      <button type="button" className="gl-login-forgot" onClick={() => setPhase('reset')}>Olvidaste tu contrasena?</button>
      <div className="gl-login-actions">
        <button type="button" className="btn ghost" onClick={onBack}><Icon name="prev" size={14} /> Volver</button>
        <button type="submit" className="btn">Entrar <Icon name="next" size={14} /></button>
      </div>
    </motion.form>
  )
}

export default function EntryGate() {
  const { enterAs } = useAuth()
  const [login, setLogin] = useState(null)
  const [leaving, setLeaving] = useState(false) // el contenido se desvanece PRIMERO
  const [warp, setWarp] = useState(false)        // luego ocurre el destello
  const [hover, setHover] = useState(null)
  const shown = hover || ROLES[0]

  // Block page scroll while the gate is open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const pick = (role) => { if (role.needsLogin) setLogin(role); else launch(role) }
  // Secuencia: (1) desvanecer el contenido suave, (2) disparar el destello,
  // (3) entrar a la app. Nada de destello mientras los tabs siguen visibles.
  const launch = (role) => {
    setLeaving(true)
    setTimeout(() => setWarp(true), 480)          // el fade del contenido ya termino
    setTimeout(() => enterAs(role.key), 480 + 640) // el destello alcanzo a lucirse
  }

  return (
    <motion.div
      className="gl-overlay gl-gate-fixed"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
    >
      <div className={`gl-moons ${warp ? 'warp' : ''}`}>
        {/* wrapper que desvanece TODO el contenido (tabs/lunas/login) antes del destello */}
        <motion.div
          className="gl-moons-content"
          animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 0.94 : 1 }}
          transition={{ duration: 0.44, ease: 'easeInOut' }}
          style={{ pointerEvents: leaving ? 'none' : 'auto' }}
        >
          <AnimatePresence mode="wait">
            {login ? (
              <LoginPanel key="login" role={login} onBack={() => setLogin(null)} onDone={() => launch(login)} />
            ) : (
              <motion.div key="pick" className="gl-moons-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="gl-head"><h1>Bienvenido a VIBEverse</h1><p>Toca una luna para elegir tu rol.</p></div>
                <div className="gl-moons-system">
                  <div className="gl-moons-core"><GasSphere role={shown} size={210} /></div>
                  {ROLES.map((role, i) => (
                    <button
                      key={role.key}
                      className={`gl-moon m${i} ${shown.key === role.key ? 'sel' : ''}`}
                      onMouseEnter={() => setHover(role)}
                      onFocus={() => setHover(role)}
                      onClick={() => pick(role)}
                      title={role.title}
                    >
                      <GasSphere role={role} size={70} spin={false} />
                      <span className="gl-moon-label">{role.title}</span>
                    </button>
                  ))}
                </div>
                <div className="gl-moons-info">
                  <strong>{shown.title}</strong>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        {warp && <div className="gl-warp-flash" />}
      </div>
    </motion.div>
  )
}
