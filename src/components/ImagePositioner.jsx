import { useState, useRef } from 'react'

// mini-editor de posicion de imagen. muestra la imagen dentro de un frame con
// object-fit:cover y deja que el user arrastre para elegir que porcion se ve.
// devuelve un string "X% Y%" para usar como object-position.
// no hace crop ni genera data URLs: solo guarda la posicion. escalable y ligero.
export default function ImagePositioner({ src, value, onChange, height = 80 }) {
  const frameRef = useRef(null)
  const drag = useRef(null)
  // value es "50% 50%" por default
  const [posX, posY] = (value || '50% 50%').split(' ').map((v) => parseFloat(v))
  const [local, setLocal] = useState({ x: posX, y: posY })

  const onPointerDown = (e) => {
    e.preventDefault()
    drag.current = { sx: e.clientX, sy: e.clientY, ox: local.x, oy: local.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drag.current) return
    const frame = frameRef.current
    if (!frame) return
    const dx = e.clientX - drag.current.sx
    const dy = e.clientY - drag.current.sy
    // mover 1px = ~0.5% (sensibilidad razonable para un frame chico)
    const nx = Math.min(100, Math.max(0, drag.current.ox - dx * 0.4))
    const ny = Math.min(100, Math.max(0, drag.current.oy - dy * 0.4))
    setLocal({ x: nx, y: ny })
  }

  const onPointerUp = () => {
    drag.current = null
    onChange(`${Math.round(local.x)}% ${Math.round(local.y)}%`)
  }

  if (!src) return null

  return (
    <div
      ref={frameRef}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-sm)',
        height, cursor: 'grab', border: '1px solid rgba(159,134,215,0.3)',
        userSelect: 'none', touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img
        src={src}
        alt="posicionar"
        draggable={false}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: `${local.x}% ${local.y}%`,
          pointerEvents: 'none',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 4, right: 6,
        fontSize: 10, color: 'rgba(255,255,255,0.7)',
        background: 'rgba(0,0,0,0.5)', padding: '2px 6px',
        borderRadius: 'var(--radius-sm)', pointerEvents: 'none',
      }}>
        Arrastra para ajustar
      </div>
    </div>
  )
}
