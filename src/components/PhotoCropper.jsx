import { useState, useRef, useCallback } from 'react'
import Icon from './Icon.jsx'
import { uiZoom } from '../lib/uiZoom.js'

// overlay de crop cuadrado 1:1 para ajustar fotos de personas.
// recibe un src (data URL o URL), permite drag + zoom, y devuelve
// un crop de 80x80 JPEG al confirmar.
export default function PhotoCropper({ src, onDone, onCancel }) {
  const frameRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const drag = useRef(null)

  const onLoad = (e) => {
    setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })
  }

  const FRAME = 240
  const OUT = 80
  const baseScale = natural.w ? Math.max(FRAME / natural.w, FRAME / natural.h) : 1
  const dispW = natural.w * baseScale * zoom
  const dispH = natural.h * baseScale * zoom

  const clamp = useCallback((p) => {
    const maxX = Math.max(0, (dispW - FRAME) / 2)
    const maxY = Math.max(0, (dispH - FRAME) / 2)
    return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) }
  }, [dispW, dispH])

  const onPointerDown = (e) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, z: uiZoom() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    setPos(clamp({ x: drag.current.ox + (e.clientX - drag.current.sx) / drag.current.z, y: drag.current.oy + (e.clientY - drag.current.sy) / drag.current.z }))
  }
  const onPointerUp = () => { drag.current = null }

  const onZoom = (z) => {
    setZoom(z)
    setPos((p) => {
      const ndW = natural.w * baseScale * z
      const ndH = natural.h * baseScale * z
      const maxX = Math.max(0, (ndW - FRAME) / 2)
      const maxY = Math.max(0, (ndH - FRAME) / 2)
      return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) }
    })
  }

  const confirm = () => {
    const canvas = document.createElement('canvas')
    canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      const scale = OUT / FRAME
      const drawW = dispW * scale
      const drawH = dispH * scale
      const dx = (OUT - drawW) / 2 + pos.x * scale
      const dy = (OUT - drawH) / 2 + pos.y * scale
      ctx.fillStyle = '#1e1538'
      ctx.fillRect(0, 0, OUT, OUT)
      ctx.drawImage(img, dx, dy, drawW, drawH)
      onDone(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = src
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 340, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Ajustar foto</h3>
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>Arrastra para reposicionar. El cuadrado es lo que se vera.</p>

        <div
          ref={frameRef}
          style={{
            width: FRAME, height: FRAME, margin: '0 auto', overflow: 'hidden',
            borderRadius: 'var(--radius)', position: 'relative', cursor: 'grab',
            border: '2px solid rgba(159,134,215,0.3)', background: '#1e1538',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            src={src}
            alt="crop"
            draggable={false}
            onLoad={onLoad}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: dispW, height: dispH,
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              maxWidth: 'none', pointerEvents: 'none',
            }}
          />
          {/* grid overlay */}
          <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', top: '33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', top: '66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <Icon name="image" size={13} />
          <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => onZoom(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 11, width: 35 }}>{Math.round(zoom * 100)}%</span>
        </div>

        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn" onClick={confirm}><Icon name="star" size={14} /> Confirmar</button>
        </div>
      </div>
    </div>
  )
}
