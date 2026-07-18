import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import logo from '../assets/vibe-logo.png'

// logo flotando en gravedad cero con easter egg: combo counter + doom fire 8-bit.
// el fuego usa el algoritmo clasico de DOOM (1993): un buffer de pixeles donde cada
// pixel se propaga hacia arriba con decay aleatorio. se renderiza pixelado para el
// look retro. la altura del fuego crece con los tiers (50/100/200/500 combo).

const COMBO_WINDOW_MS = 3000
const USER_SPEED_THRESHOLD = 2

// cada tier sube la altura del fuego (mas alto = mas dramatico)
const FLAME_TIERS = [
  { threshold: 50, label: 'EMBER', fireHeight: 40 },
  { threshold: 100, label: 'BLAZE', fireHeight: 55 },
  { threshold: 200, label: 'INFERNO', fireHeight: 70 },
  { threshold: 500, label: 'SUPERNOVA', fireHeight: 90 },
]

function getCurrentTier(combo) {
  let tier = null
  for (let i = FLAME_TIERS.length - 1; i >= 0; i--) {
    if (combo >= FLAME_TIERS[i].threshold) { tier = FLAME_TIERS[i]; break }
  }
  return tier
}

export default function FloatingLogo() {
  const containerRef = useRef(null)
  const logoRef = useRef(null)
  const state = useRef({
    x: 0, y: 0,
    vx: 0.3, vy: 0.2,
    rotation: 0,
    angularVel: 0.08 + Math.random() * 0.12,
    wobblePhase: Math.random() * Math.PI * 2,
    wobblePhaseY: Math.random() * Math.PI * 2,
    scale: 1,
    opacity: 0.14,
    dragging: false,
    dragOffset: { x: 0, y: 0 },
    lastMouse: { x: 0, y: 0, t: 0 },
    mouseVx: 0, mouseVy: 0,
    raf: null,
    size: 140,
    time: 0,
    combo: 0,
    lastBounceTime: 0,
    comboTimeout: null,
    overlayEl: null,
    digitEls: null,
    labelEl: null,
    tierEl: null,
    bestEl: null,
    best: 0,
    flamesCanvas: null,
    flamesCtx: null,
    flamesRaf: null,
    flamesActive: false,
    currentTier: null,
    fireOffscreen: null,
    rowWrap: null,
  })

  useEffect(() => {
    const container = containerRef.current
    const el = logoRef.current
    if (!container || !el) return

    const s = state.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) { el.style.opacity = '0.10'; return }

    // === DOOM FIRE, 8BIT RETRO ===
    // paleta de 36 colores: transparente -> morado deep -> magenta -> rojo -> naranja -> amarillo -> blanco
    const FIRE_PALETTE = [
      [0,0,0,0],[20,10,40,40],[40,15,60,80],[60,20,80,120],[80,25,100,160],
      [100,30,120,200],[111,54,125,220],[130,60,140,235],[150,70,160,245],[159,80,180,255],
      [170,60,160,255],[190,50,140,255],[210,40,120,255],[230,50,100,255],[240,60,80,255],
      [250,80,60,255],[255,100,40,255],[255,120,30,255],[255,140,20,255],[255,160,30,255],
      [255,180,40,255],[255,195,50,255],[255,210,60,255],[255,220,80,255],[255,230,100,255],
      [255,235,120,255],[255,240,140,255],[255,245,160,255],[255,248,180,255],[255,250,200,255],
      [255,252,220,255],[255,253,235,255],[255,254,245,255],[255,255,250,255],[255,255,253,255],
      [255,255,255,255],
    ]
    const FIRE_W = 80
    let fireH = 30
    let fireBuffer = null

    const initFireBuffer = () => {
      fireBuffer = new Uint8Array(FIRE_W * fireH)
      for (let x = 0; x < FIRE_W; x++) fireBuffer[(fireH - 1) * FIRE_W + x] = FIRE_PALETTE.length - 1
    }

    const propagateFire = () => {
      for (let y = 0; y < fireH - 1; y++) {
        for (let x = 0; x < FIRE_W; x++) {
          const src = (y + 1) * FIRE_W + x
          const decay = Math.floor(Math.random() * 3)
          const wind = Math.floor(Math.random() * 3) - 1
          const dstX = Math.min(FIRE_W - 1, Math.max(0, x + wind))
          fireBuffer[y * FIRE_W + dstX] = Math.max(0, fireBuffer[src] - decay)
        }
      }
    }

    const renderFire = (ctx, w, h) => {
      if (!fireBuffer || !s.fireOffscreen) return
      const off = s.fireOffscreen
      off.width = FIRE_W; off.height = fireH
      const offCtx = off.getContext('2d')
      const img = offCtx.createImageData(FIRE_W, fireH)
      const d = img.data
      for (let i = 0; i < FIRE_W * fireH; i++) {
        const c = FIRE_PALETTE[fireBuffer[i]]
        const p = i * 4
        d[p] = c[0]; d[p+1] = c[1]; d[p+2] = c[2]; d[p+3] = c[3]
      }
      offCtx.putImageData(img, 0, 0)
      // escalar pixelado al canvas completo (el canvas ya es del tamano del cuadro)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(off, 0, 0, w, h)
    }

    const mountFlames = () => {
      if (s.flamesCanvas) return
      if (!s.rowWrap) return
      const canvas = document.createElement('canvas')
      Object.assign(canvas.style, {
        position: 'absolute',
        inset: '-20px -14px',
        width: 'calc(100% + 28px)',
        height: 'calc(100% + 40px)',
        zIndex: '0',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.6s ease',
        imageRendering: 'pixelated',
        borderRadius: '8px',
      })
      canvas.setAttribute('aria-hidden', 'true')
      s.rowWrap.appendChild(canvas)
      s.flamesCanvas = canvas
      s.flamesCtx = canvas.getContext('2d')
      s.fireOffscreen = document.createElement('canvas')
      resizeFlames()
    }

    const resizeFlames = () => {
      if (!s.flamesCanvas || !s.rowWrap) return
      const rect = s.rowWrap.getBoundingClientRect()
      // el canvas cubre el area extendida (con el padding extra)
      s.flamesCanvas.width = Math.ceil(rect.width + 28)
      s.flamesCanvas.height = Math.ceil(rect.height + 40)
    }

    const startFlames = (tier) => {
      mountFlames()
      s.currentTier = tier
      fireH = tier.fireHeight
      initFireBuffer()
      if (!s.flamesActive) {
        s.flamesActive = true
        s.flamesCanvas.style.opacity = '1'
        const loop = () => {
          if (!s.flamesActive) return
          const ctx = s.flamesCtx
          const w = s.flamesCanvas.width
          const h = s.flamesCanvas.height
          ctx.clearRect(0, 0, w, h)
          propagateFire()
          renderFire(ctx, w, h)
          s.flamesRaf = requestAnimationFrame(loop)
        }
        s.flamesRaf = requestAnimationFrame(loop)
      }
    }

    const upgradeTier = (tier) => {
      s.currentTier = tier
      const newH = tier.fireHeight
      if (newH !== fireH) {
        // preservar el buffer viejo en el nuevo (transicion suave)
        const oldBuf = fireBuffer
        const oldH = fireH
        fireH = newH
        fireBuffer = new Uint8Array(FIRE_W * fireH)
        // copiar las filas existentes abajo
        for (let y = 0; y < Math.min(oldH, fireH); y++) {
          const srcRow = (oldH - 1 - y) * FIRE_W
          const dstRow = (fireH - 1 - y) * FIRE_W
          for (let x = 0; x < FIRE_W; x++) fireBuffer[dstRow + x] = oldBuf ? oldBuf[srcRow + x] : 0
        }
        // ultima fila = fuente
        for (let x = 0; x < FIRE_W; x++) fireBuffer[(fireH - 1) * FIRE_W + x] = FIRE_PALETTE.length - 1
      }
      if (s.flamesCanvas) {
        s.flamesCanvas.style.opacity = '0.4'
        setTimeout(() => { if (s.flamesCanvas) s.flamesCanvas.style.opacity = '1' }, 200)
      }
    }

    const stopFlames = () => {
      s.flamesActive = false
      s.currentTier = null
      if (s.flamesRaf) cancelAnimationFrame(s.flamesRaf)
      // apagar la fuente y dejar que el fuego muera naturalmente
      if (fireBuffer) {
        for (let x = 0; x < FIRE_W; x++) fireBuffer[(fireH - 1) * FIRE_W + x] = 0
        let frames = 50
        const fade = () => {
          if (frames-- <= 0) { if (s.flamesCanvas) s.flamesCanvas.style.opacity = '0'; return }
          const ctx = s.flamesCtx
          if (ctx && s.flamesCanvas) {
            ctx.clearRect(0, 0, s.flamesCanvas.width, s.flamesCanvas.height)
            propagateFire()
            renderFire(ctx, s.flamesCanvas.width, s.flamesCanvas.height)
          }
          requestAnimationFrame(fade)
        }
        requestAnimationFrame(fade)
      } else if (s.flamesCanvas) { s.flamesCanvas.style.opacity = '0' }
    }

    const onResizeFlames = () => resizeFlames()
    // === COMBO OVERLAY ===
    const mountComboOverlay = () => {
      if (s.overlayEl) return
      const overlay = document.createElement('div')
      overlay.setAttribute('aria-hidden', 'true')
      Object.assign(overlay.style, {
        position: 'fixed', bottom: '24px', left: '50%',
        transform: 'translateX(-50%)', zIndex: '2',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        pointerEvents: 'none', opacity: '0', transition: 'opacity 0.4s ease',
      })

      const row = document.createElement('div')
      Object.assign(row.style, {
        display: 'flex', gap: '3px',
        background: 'rgba(10, 6, 20, 0.9)',
        border: '1px solid rgba(159, 134, 215, 0.3)',
        borderRadius: '6px', padding: '8px 14px',
        position: 'relative', zIndex: '1',
      })

      // wrapper con position relative para que el fire canvas quede detras
      const rowWrap = document.createElement('div')
      Object.assign(rowWrap.style, {
        position: 'relative',
        display: 'inline-block',
      })
      rowWrap.appendChild(row)
      s.rowWrap = rowWrap

      const digits = []
      for (let i = 0; i < 5; i++) {
        const d = document.createElement('span')
        Object.assign(d.style, {
          fontFamily: '"Share Tech Mono", "Courier New", monospace',
          fontSize: '28px', fontWeight: '700', width: '22px',
          textAlign: 'center', color: 'rgba(159, 134, 215, 0.2)',
          lineHeight: '1', overflow: 'hidden', display: 'inline-block',
          transition: 'color 0.2s ease',
        })
        d.textContent = '0'; d.dataset.val = '0'
        row.appendChild(d); digits.push(d)
      }

      // tier label (EMBER / BLAZE / INFERNO / SUPERNOVA)
      const tierLabel = document.createElement('div')
      Object.assign(tierLabel.style, {
        fontFamily: '"Share Tech Mono", "Courier New", monospace',
        fontSize: '10px', fontWeight: '700', letterSpacing: '5px',
        textTransform: 'uppercase', color: 'rgba(255, 180, 60, 0)',
        transition: 'color 0.4s ease, transform 0.3s ease',
        transform: 'scale(0.8)',
      })
      tierLabel.textContent = ''

      const label = document.createElement('div')
      Object.assign(label.style, {
        fontFamily: '"Share Tech Mono", "Courier New", monospace',
        fontSize: '11px', fontWeight: '700', letterSpacing: '4px',
        textTransform: 'uppercase', color: 'rgba(209, 160, 226, 0)',
        transition: 'color 0.3s ease, transform 0.3s ease',
        transform: 'scale(0.8)',
      })
      label.textContent = 'COMBO'

      const best = document.createElement('div')
      Object.assign(best.style, {
        fontFamily: '"Share Tech Mono", "Courier New", monospace',
        fontSize: '10px', letterSpacing: '2px',
        color: 'rgba(159, 134, 215, 0)', transition: 'color 0.4s ease',
      })
      best.textContent = ''

      overlay.appendChild(tierLabel)
      overlay.appendChild(rowWrap)
      overlay.appendChild(label)
      overlay.appendChild(best)
      document.body.appendChild(overlay)

      s.overlayEl = overlay; s.digitEls = digits
      s.labelEl = label; s.tierEl = tierLabel; s.bestEl = best

      if (!document.querySelector('link[data-combo-font]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap'
        link.dataset.comboFont = '1'
        document.head.appendChild(link)
      }
    }

    const updateDigits = (value) => {
      if (!s.digitEls) return
      const str = String(value).padStart(5, '0')
      const valueStr = String(value)
      const tier = getCurrentTier(value)

      for (let i = 0; i < 5; i++) {
        const digit = s.digitEls[i]
        const newVal = str[i]
        const isActive = i >= (5 - valueStr.length) && value > 0

        if (newVal !== digit.dataset.val) {
          digit.dataset.val = newVal
          animate(digit, { translateY: ['-100%', '0%'], duration: 250, ease: 'outBack' })
          digit.textContent = newVal
        }

        if (tier && isActive) {
          // color segun tier (doom fire palette tones)
          const tierColors = {
            EMBER: { main: '255,220,80', glow: '255,140,20' },
            BLAZE: { main: '255,220,80', glow: '255,140,20' },
            INFERNO: { main: '255,100,40', glow: '230,50,100' },
            SUPERNOVA: { main: '255,255,255', glow: '200,60,200' },
          }
          const tc = tierColors[tier.label] || tierColors.BLAZE
          digit.style.color = `rgba(${tc.main},1)`
          digit.style.textShadow = `0 0 8px rgba(${tc.main},0.6), 0 0 16px rgba(${tc.glow},0.3)`
        } else if (isActive) {
          digit.style.color = 'rgba(209, 160, 226, 1)'
          digit.style.textShadow = '0 0 8px rgba(159, 134, 215, 0.6)'
        } else {
          digit.style.color = 'rgba(159, 134, 215, 0.2)'
          digit.style.textShadow = 'none'
        }
      }

      // tier label
      if (tier && s.tierEl) {
        const tierColors = {
          EMBER: '255,220,80', BLAZE: '255,220,80',
          INFERNO: '255,100,40', SUPERNOVA: '255,255,255',
        }
        const tc = tierColors[tier.label] || '255,220,80'
        s.tierEl.textContent = tier.label
        s.tierEl.style.color = `rgba(${tc},0.9)`
        s.tierEl.style.transform = 'scale(1)'
        s.tierEl.style.textShadow = `0 0 10px rgba(${tc},0.5)`
      } else if (s.tierEl) {
        s.tierEl.style.color = 'rgba(255, 180, 60, 0)'
        s.tierEl.style.transform = 'scale(0.8)'
      }
    }

    const showLabel = () => {
      if (!s.labelEl) return
      s.labelEl.style.color = 'rgba(209, 160, 226, 0.9)'
      s.labelEl.style.transform = 'scale(1)'
      s.labelEl.style.textShadow = '0 0 10px rgba(159, 134, 215, 0.5)'
    }
    const hideLabel = () => {
      if (!s.labelEl) return
      s.labelEl.style.color = 'rgba(209, 160, 226, 0)'
      s.labelEl.style.transform = 'scale(0.8)'
      s.labelEl.style.textShadow = 'none'
    }
    const showOverlay = () => { if (s.overlayEl) s.overlayEl.style.opacity = '1' }
    const hideOverlay = () => { if (s.overlayEl) s.overlayEl.style.opacity = '0' }

    const updateBest = () => {
      if (!s.bestEl) return
      if (s.combo > s.best) {
        s.best = s.combo
        s.bestEl.textContent = `BEST: ${String(s.best).padStart(5, '0')}`
        s.bestEl.style.color = 'rgba(159, 134, 215, 0.6)'
        animate(s.bestEl, { scale: [1.2, 1], duration: 300, ease: 'outBack' })
      }
    }

    // === BOUNCE REGISTRATION ===
    const registerBounce = () => {
      const now = Date.now()
      const delta = now - s.lastBounceTime
      s.lastBounceTime = now
      if (s.comboTimeout) clearTimeout(s.comboTimeout)

      mountComboOverlay()

      if (delta < COMBO_WINDOW_MS || s.combo === 0) {
        const prevTier = getCurrentTier(s.combo)
        s.combo++
        const newTier = getCurrentTier(s.combo)

        showOverlay()
        updateDigits(s.combo)
        if (s.combo >= 3) showLabel()

        // activar o subir tier de flames
        if (newTier && !prevTier) {
          startFlames(newTier)
        } else if (newTier && prevTier && newTier.threshold > prevTier.threshold) {
          upgradeTier(newTier)
          // animate tier upgrade con scale en el label
          if (s.tierEl) animate(s.tierEl, { scale: [1.4, 1], duration: 400, ease: 'outBack' })
        }

        const glow = Math.min(0.35, 0.14 + s.combo * 0.01)
        animate(s, { opacity: [glow, 0.14], duration: 400, ease: 'outQuad' })
      }

      s.comboTimeout = setTimeout(() => {
        updateBest()
        hideLabel()
        stopFlames()
        if (s.tierEl) { s.tierEl.style.color = 'rgba(255,180,60,0)'; s.tierEl.style.transform = 'scale(0.8)' }
        if (s.digitEls) {
          s.digitEls.forEach((d, i) => {
            setTimeout(() => {
              animate(d, { translateY: ['0%', '100%'], opacity: [1, 0.3], duration: 200, ease: 'inQuad' })
              setTimeout(() => {
                d.textContent = '0'; d.dataset.val = '0'
                d.style.color = 'rgba(159, 134, 215, 0.2)'
                d.style.textShadow = 'none'; d.style.opacity = '1'; d.style.transform = ''
              }, 200)
            }, i * 60)
          })
        }
        setTimeout(() => { s.combo = 0; hideOverlay() }, 500)
      }, COMBO_WINDOW_MS)
    }

    // === POSICION INICIAL ===
    const bounds = container.getBoundingClientRect()
    s.x = Math.random() * (bounds.width - s.size)
    s.y = Math.random() * (bounds.height - s.size)
    const initAngle = Math.random() * Math.PI * 2
    const initSpeed = 0.2 + Math.random() * 0.3
    s.vx = Math.cos(initAngle) * initSpeed
    s.vy = Math.sin(initAngle) * initSpeed

    const applyTransform = () => {
      el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg) scale(${s.scale})`
      el.style.opacity = String(s.opacity)
    }

    // === PHYSICS ===
    const tick = () => {
      s.time++
      if (!s.dragging) {
        const b = container.getBoundingClientRect()
        const maxX = b.width - s.size
        const maxY = b.height - s.size
        const wobbleX = Math.sin(s.wobblePhase) * 0.08
        const wobbleY = Math.cos(s.wobblePhaseY) * 0.06
        s.wobblePhase += 0.008; s.wobblePhaseY += 0.006
        s.x += s.vx + wobbleX; s.y += s.vy + wobbleY

        const spd = Math.hypot(s.vx, s.vy)
        const isUserSpeed = spd > USER_SPEED_THRESHOLD
        let bounced = false
        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx) * 0.92; bounced = true }
        if (s.x >= maxX) { s.x = maxX; s.vx = -Math.abs(s.vx) * 0.92; bounced = true }
        if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy) * 0.92; bounced = true }
        if (s.y >= maxY) { s.y = maxY; s.vy = -Math.abs(s.vy) * 0.92; bounced = true }
        if (bounced && isUserSpeed) registerBounce()

        s.rotation += s.angularVel
        if (s.time % 300 === 0) {
          s.angularVel += (Math.random() - 0.5) * 0.02
          s.angularVel = Math.max(-0.3, Math.min(0.3, s.angularVel))
        }
        if (spd > 0.8) { s.vx *= 0.9992; s.vy *= 0.9992 }
        if (spd < 0.1) { s.vx += (Math.random() - 0.5) * 0.05; s.vy += (Math.random() - 0.5) * 0.05 }
      }
      applyTransform()
      s.raf = requestAnimationFrame(tick)
    }

    // === INTERACTIONS ===
    const onClick = (e) => {
      if (s.dragging) return
      e.stopPropagation()
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2
      const dx = cx - e.clientX, dy = cy - e.clientY
      const dist = Math.max(1, Math.hypot(dx, dy))
      const force = 2.5 + Math.random() * 1.5
      s.vx += (dx / dist) * force; s.vy += (dy / dist) * force
      s.angularVel += (Math.random() - 0.5) * 0.15
      animate(s, { opacity: [0.22, 0.14], scale: [1.06, 1], duration: 800, ease: 'outQuad' })
    }

    const onPointerDown = (e) => {
      e.preventDefault(); s.dragging = true
      const b = container.getBoundingClientRect()
      s.dragOffset.x = e.clientX - b.left - s.x
      s.dragOffset.y = e.clientY - b.top - s.y
      s.lastMouse = { x: e.clientX, y: e.clientY, t: Date.now() }
      s.mouseVx = 0; s.mouseVy = 0
      el.style.cursor = 'grabbing'; el.setPointerCapture(e.pointerId)
      animate(s, { opacity: 0.22, scale: 1.05, duration: 300, ease: 'outQuad' })
    }

    const onPointerMove = (e) => {
      if (!s.dragging) return
      const b = container.getBoundingClientRect()
      s.x = e.clientX - b.left - s.dragOffset.x
      s.y = e.clientY - b.top - s.dragOffset.y
      const maxX = b.width - s.size, maxY = b.height - s.size
      s.x = Math.max(0, Math.min(maxX, s.x))
      s.y = Math.max(0, Math.min(maxY, s.y))
      const now = Date.now()
      const dt = Math.max(1, now - s.lastMouse.t)
      s.mouseVx = (e.clientX - s.lastMouse.x) / dt * 16
      s.mouseVy = (e.clientY - s.lastMouse.y) / dt * 16
      s.lastMouse = { x: e.clientX, y: e.clientY, t: now }
      s.rotation += s.mouseVx * 0.3
    }

    const onPointerUp = (e) => {
      if (!s.dragging) return
      s.dragging = false; el.releasePointerCapture(e.pointerId)
      el.style.cursor = 'grab'
      s.vx = s.mouseVx * 0.6; s.vy = s.mouseVy * 0.6
      s.angularVel = s.mouseVx * 0.02
      animate(s, { opacity: 0.14, scale: 1, duration: 600, ease: 'outQuad' })
    }

    el.addEventListener('click', onClick)
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    window.addEventListener('resize', onResizeFlames)
    s.raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(s.raf)
      if (s.flamesRaf) cancelAnimationFrame(s.flamesRaf)
      if (s.comboTimeout) clearTimeout(s.comboTimeout)
      el.removeEventListener('click', onClick)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', onResizeFlames)
      if (s.overlayEl?.parentNode) s.overlayEl.parentNode.removeChild(s.overlayEl)
      if (s.flamesCanvas?.parentNode) s.flamesCanvas.parentNode.removeChild(s.flamesCanvas)
    }
  }, [])

  return (
    <div ref={containerRef} className="floating-logo-container" aria-hidden="true">
      <img
        ref={logoRef}
        src={logo}
        alt=""
        className="floating-logo"
        draggable="false"
      />
    </div>
  )
}
