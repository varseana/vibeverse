import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../lib/store.jsx'
import Icon from './Icon.jsx'

const AUTO_MS = 5000   // auto-advance interval
const PAUSE_MS = 5000  // how long to pause auto-advance after a manual click

// Coverflow carousel: the active flyer sits sharp in the center while the
// previous and next flyers sit behind it, scaled down and blurred, peeking
// from the sides. Arrows pause the auto-advance for a few seconds, then resume.
export default function FlyerCarousel() {
  const { flyers } = useStore()
  const ordered = [...flyers].sort((a, b) => (b.isHome ? 1 : 0) - (a.isHome ? 1 : 0))
  const n = ordered.length

  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [stageW, setStageW] = useState(0)
  const stageRef = useRef(null)
  const pauseTimer = useRef(null)

  // Measure the stage width so we can place slides in pixels (smooth + exact).
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => setStageW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => { if (i >= n) setI(0) }, [n, i])

  // Auto-advance, unless paused or there is nothing to rotate.
  useEffect(() => {
    if (paused || n <= 1) return
    const t = setTimeout(() => setI((x) => (x + 1) % n), AUTO_MS)
    return () => clearTimeout(t)
  }, [i, paused, n])

  useEffect(() => () => clearTimeout(pauseTimer.current), [])

  if (n === 0) return null

  // Pause the auto-timer for PAUSE_MS after a manual interaction, then resume.
  const holdThenResume = () => {
    setPaused(true)
    clearTimeout(pauseTimer.current)
    pauseTimer.current = setTimeout(() => setPaused(false), PAUSE_MS)
  }
  const go = (dir) => { setI((x) => (x + dir + n) % n); holdThenResume() }
  const jump = (idx) => { setI(idx); holdThenResume() }

  // Shortest circular distance from the active slide, mapped to [-2..2].
  const relOf = (idx) => {
    let rel = idx - i
    if (rel > n / 2) rel -= n
    if (rel < -n / 2) rel += n
    return rel
  }

  const slideW = Math.min(stageW * 0.72, 900)
  const stageH = slideW * 42 / 96
  const sideShift = slideW * 0.52

  const layoutFor = (rel) => {
    if (rel === 0) return { x: 0, scale: 1, opacity: 1, blur: 0, z: 3, shadow: 0.45 }
    if (rel === -1) return { x: -sideShift, scale: 0.82, opacity: 0.55, blur: 6, z: 2, shadow: 0.25 }
    if (rel === 1) return { x: sideShift, scale: 0.82, opacity: 0.55, blur: 6, z: 2, shadow: 0.25 }
    return { x: rel < 0 ? -sideShift * 1.8 : sideShift * 1.8, scale: 0.6, opacity: 0, blur: 10, z: 1, shadow: 0 }
  }

  return (
    <div className="carousel">
      <div className="carousel-stage" ref={stageRef} style={{ height: stageH || undefined }}>
        {ordered.map((f, idx) => {
          const rel = relOf(idx)
          const L = layoutFor(rel)
          const img = <img src={f.image} alt={f.title} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          return (
            <motion.div
              key={f.id}
              className="carousel-slide"
              initial={false}
              animate={{ x: L.x, scale: L.scale, opacity: L.opacity, filter: `blur(${L.blur}px)`, zIndex: L.z }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: slideW, height: stageH, marginLeft: -slideW / 2,
                boxShadow: `0 20px 50px rgba(0,0,0,${L.shadow})`,
                pointerEvents: rel === 0 ? 'auto' : 'none',
              }}
            >
              {rel === 0 && f.link ? (
                <a href={f.link} target="_blank" rel="noreferrer" style={{ display: 'block', height: '100%' }}>{img}</a>
              ) : img}
              {rel === 0 && (
                <div className="carousel-caption">
                  <strong>{f.title}</strong>
                  {f.link && <span className="carousel-link-hint">Clic para abrir</span>}
                </div>
              )}
            </motion.div>
          )
        })}

        {n > 1 && (
          <>
            <button className="carousel-arrow left" onClick={() => go(-1)} aria-label="Anterior"><Icon name="prev" size={24} /></button>
            <button className="carousel-arrow right" onClick={() => go(1)} aria-label="Siguiente"><Icon name="next" size={24} /></button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="carousel-dots">
          {ordered.map((f, idx) => (
            <button
              key={f.id}
              className={`carousel-dot ${idx === i ? 'active' : ''}`}
              onClick={() => jump(idx)}
              aria-label={`Ir al flyer ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
