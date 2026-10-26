import { useState, useRef, useCallback } from 'react'
import Icon from './Icon.jsx'
import { uiZoom } from '../lib/uiZoom.js'

// Instagram-style image editor. The user picks a file, then drags to reposition
// and uses a slider to zoom inside a frame with a configurable aspect ratio.
// On confirm it renders the visible crop to a canvas and returns a compressed
// JPEG data URL. Defaults to the flyer carousel ratio (96:42) but callers can
// pass a different `aspectRatio` (e.g. event cards) and `title`.
export default function ImageEditor({ onDone, onCancel, aspectRatio = 96 / 42, outWidth = 960, title = 'Subir imagen del flyer' }) {
  const AR = aspectRatio
  const OUT_W = outWidth
  const OUT_H = Math.round(OUT_W / AR)
  const [src, setSrc] = useState(null)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // offset in px within the frame
  const frameRef = useRef(null)
  const drag = useRef(null)

  const onFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setNatural({ w: img.naturalWidth, h: img.naturalHeight })
        setSrc(reader.result)
        setZoom(1)
        setPos({ x: 0, y: 0 })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  // Base scale: cover the frame at zoom = 1.
  const frameW = frameRef.current?.clientWidth || 480
  const frameH = frameW / AR
  const baseScale = natural.w ? Math.max(frameW / natural.w, frameH / natural.h) : 1
  const dispW = natural.w * baseScale * zoom
  const dispH = natural.h * baseScale * zoom

  // Keep the image covering the frame (clamp the drag offset).
  const clamp = useCallback((p) => {
    const maxX = Math.max(0, (dispW - frameW) / 2)
    const maxY = Math.max(0, (dispH - frameH) / 2)
    return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) }
  }, [dispW, dispH, frameW, frameH])

  const onPointerDown = (e) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, z: uiZoom() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const nx = drag.current.ox + (e.clientX - drag.current.sx) / drag.current.z
    const ny = drag.current.oy + (e.clientY - drag.current.sy) / drag.current.z
    setPos(clamp({ x: nx, y: ny }))
  }
  const onPointerUp = () => { drag.current = null }

  const changeZoom = (z) => {
    setZoom(z)
    // Re-clamp with the new size on the next tick via functional update.
    setPos((p) => {
      const ndispW = natural.w * baseScale * z
      const ndispH = natural.h * baseScale * z
      const maxX = Math.max(0, (ndispW - frameW) / 2)
      const maxY = Math.max(0, (ndispH - frameH) / 2)
      return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) }
    })
  }

  // Render the visible crop to a canvas and hand back a JPEG data URL.
  const confirm = () => {
    const canvas = document.createElement('canvas')
    canvas.width = OUT_W
    canvas.height = OUT_H
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      const scale = OUT_W / frameW              // frame px -> output px
      const drawW = dispW * scale
      const drawH = dispH * scale
      const dx = (OUT_W - drawW) / 2 + pos.x * scale
      const dy = (OUT_H - drawH) / 2 + pos.y * scale
      ctx.fillStyle = '#0a0714'
      ctx.fillRect(0, 0, OUT_W, OUT_H)
      ctx.drawImage(img, dx, dy, drawW, drawH)
      onDone(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = src
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>

        {!src ? (
          <label
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}
          >
            <Icon name="image" size={34} />
            <strong>Arrastra una imagen o haz clic</strong>
            <span className="muted">PNG o JPG, se ajusta al formato mostrado</span>
            <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files[0])} />
          </label>
        ) : (
          <>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Arrastra para reposicionar. Marco {OUT_W} x {OUT_H} px.
            </div>
            <div
              ref={frameRef}
              className="crop-frame"
              style={{ aspectRatio: `${OUT_W} / ${OUT_H}` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                src={src}
                alt="editar"
                draggable={false}
                style={{
                  position: 'absolute', left: '50%', top: '50%',
                  width: dispW, height: dispH,
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  maxWidth: 'none',
                }}
              />
              <div className="crop-grid" />
            </div>

            <label>Zoom</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="image" size={14} />
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => changeZoom(parseFloat(e.target.value))} style={{ flex: 1 }} />
            </div>

            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setSrc(null)}>Cambiar imagen</button>
              <button className="btn" onClick={confirm}><Icon name="plus" size={16} /> Usar imagen</button>
            </div>
          </>
        )}

        {!src && (
          <div className="modal-actions">
            <button className="btn ghost" onClick={onCancel}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}
