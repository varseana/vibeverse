// ---------------------------------------------------------------------------
// sfx: efectos de sonido de UI sintetizados (Web Audio API). Cero archivos,
// cero red: los sonidos se generan por codigo, asi que cargan siempre (el
// entorno bloquea red y GitHub Pages no serviria assets de terceros fiablemente).
//
// Pack "Minimal" (elegido por el usuario): clicks cortos y secos, muy discretos.
//
// Uso: import { sfx } from '../lib/sfx.js'; sfx.play('click')
// Mute: sfx.setMuted(true/false); sfx.isMuted(); persiste en localStorage.
// El AudioContext se crea/reanuda en el primer gesto del usuario (autoplay policy).
// ---------------------------------------------------------------------------

let actx = null
let master = null
let muted = (typeof localStorage !== 'undefined' && localStorage.getItem('vibe_sfx_muted') === '1')

function ctx() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    actx = new AC({ latencyHint: 'interactive' })
    master = actx.createGain()
    master.gain.value = 0.6
    master.connect(actx.destination)
  }
  if (actx.state === 'suspended') actx.resume()
  return actx
}

// Buffer de ruido blanco reutilizable (para clicks/pops secos).
let _noise = null
function noiseBuffer() {
  const c = ctx()
  if (!c) return null
  if (_noise) return _noise
  const len = Math.floor(c.sampleRate * 0.4)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  _noise = buf
  return buf
}

function tone({ type = 'sine', f = 440, f2 = null, dur = 0.15, vol = 0.3, attack = 0.005, when = 0 }) {
  const c = ctx(); if (!c) return
  const t = c.currentTime + when
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(f, t)
  if (f2 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise({ dur = 0.12, vol = 0.3, type = 'lowpass', f = 1200, f2 = null, q = 1, when = 0 }) {
  const c = ctx(); if (!c) return
  const buf = noiseBuffer(); if (!buf) return
  const t = c.currentTime + when
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(f, t)
  if (f2 != null) filter.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur)
  filter.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(g).connect(master)
  src.start(t)
  src.stop(t + dur + 0.02)
}

// Pack Minimal: cada accion es un sonido corto y seco.
const SOUNDS = {
  hover:  () => noise({ dur: 0.02, vol: 0.04, type: 'highpass', f: 4000 }),
  hoverout: () => noise({ dur: 0.02, vol: 0.03, type: 'highpass', f: 2600 }),
  click:  () => noise({ dur: 0.03, vol: 0.12, type: 'lowpass', f: 2000, f2: 800 }),
  edit:   () => tone({ type: 'sine', f: 900, dur: 0.05, vol: 0.12 }),
  save:   () => { tone({ type: 'sine', f: 880, dur: 0.06, vol: 0.14 }); tone({ type: 'sine', f: 1320, dur: 0.1, vol: 0.12, when: 0.05 }) },
  delete: () => noise({ dur: 0.07, vol: 0.13, type: 'lowpass', f: 600, f2: 150 }),
  toggle: () => noise({ dur: 0.025, vol: 0.1, type: 'bandpass', f: 2200, q: 1.5 }),
  dash:   () => noise({ dur: 0.12, vol: 0.09, type: 'highpass', f: 1000, f2: 5000 }),
  error:  () => tone({ type: 'sine', f: 240, dur: 0.12, vol: 0.18 }),
  warp:   () => noise({ dur: 0.4, vol: 0.1, type: 'lowpass', f: 300, f2: 4000 }),
  // Momento especial: un manager envia una nominacion de R&R y empieza a subir.
  // Pequena fanfarria ascendente (celebratoria) + un shimmer, distinta del save.
  nominate: () => {
    const notes = [523, 659, 784, 1046, 1319] // C E G C E, arpegio mayor
    notes.forEach((f, i) => tone({ type: 'triangle', f, dur: 0.28, vol: 0.16, attack: 0.008, when: i * 0.075 }))
    tone({ type: 'sine', f: 1568, dur: 0.5, vol: 0.1, when: 0.36 }) // brillo final
    noise({ dur: 0.5, vol: 0.06, type: 'highpass', f: 3000, f2: 8000, when: 0.05 }) // shimmer
  },
}

// Selector de elementos "clickeables" a los que damos sonido por defecto.
const CLICKABLE = 'button, a, [role="button"], .card.hover, .cal-ev, .ql-card, .subtabs button, .switch'

export const sfx = {
  play(name) {
    if (muted) return
    const fn = SOUNDS[name]
    if (fn) { try { fn() } catch { /* audio no disponible, ignorar */ } }
  },
  setMuted(v) {
    muted = !!v
    try { localStorage.setItem('vibe_sfx_muted', muted ? '1' : '0') } catch { /* ignore */ }
  },
  isMuted() { return muted },
  toggleMuted() { this.setMuted(!muted); return muted },

  // Delegador global: da sonido a CUALQUIER click en un elemento interactivo.
  // Se llama una sola vez (App). Un elemento puede pedir un sonido distinto con
  // data-sfx="save|delete|edit|..." o silenciarse con data-sfx="off".
  initGlobal() {
    if (this._wired || typeof document === 'undefined') return
    this._wired = true
    // Hover: suena UNA vez al entrar a un interactivo y UNA al salir. Rastreamos
    // el elemento actual: mouseover/out burbujean, pero comparamos el interactivo
    // objetivo con el previo, asi que cruzar hijos internos no vuelve a sonar.
    let current = null
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest && e.target.closest(CLICKABLE)
      if (el === current) return          // seguimos dentro del mismo interactivo
      current = el
      if (muted || !el || el.disabled) return
      if (el.dataset && el.dataset.sfx === 'off') return
      this.play('hover')
    }, true)
    document.addEventListener('mouseout', (e) => {
      if (!current) return
      // Solo cuenta como "salida" si el puntero deja el interactivo actual.
      const to = e.relatedTarget
      if (to && current.contains(to)) return // se movio a un hijo, sigue dentro
      const left = current
      current = null
      if (muted || !left || left.disabled) return
      if (left.dataset && left.dataset.sfx === 'off') return
      this.play('hoverout')
    }, true)
    // Click: sonido en cualquier interactivo. data-sfx personaliza o apaga.
    document.addEventListener('click', (e) => {
      if (muted) return
      const el = e.target.closest && e.target.closest(CLICKABLE)
      if (!el || el.disabled) return
      const s = el.dataset ? el.dataset.sfx : null
      if (s === 'off') return
      this.play(s || 'click')
    }, true)
  },
}
