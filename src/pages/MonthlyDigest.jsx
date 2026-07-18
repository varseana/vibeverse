import { useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../lib/store.jsx'
import { useAuth } from '../lib/auth.jsx'
import { AURORA_THEMES } from '../lib/auroraThemes.js'
import { normalizeRows } from '../lib/digestLayout.js'
import Icon from '../components/Icon.jsx'

// meses en espanol para las fechas
const MESES = { January: 'Enero', February: 'Febrero', March: 'Marzo', April: 'Abril', May: 'Mayo', June: 'Junio', July: 'Julio', August: 'Agosto', September: 'Septiembre', October: 'Octubre', November: 'Noviembre', December: 'Diciembre' }
function mesEs(m) { return MESES[m] || m }

// colores de confeti
const CONFETTI_BIRTHDAY = ['#9F86D7', '#22d3ee', '#fb7185', '#fbbf24', '#6fe0a8']
const CONFETTI_AMAVERSARY = ['#fde68a', '#fbbf24', '#f59e0b', '#d4a017', '#c8860a']

// genera los divs de confeti (CSS animated, se difuminan a la mitad)
function Confetti({ colors, count = 20 }) {
  return (
    <div className="digest-confetti-wrap">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="digest-confetti"
          style={{
            left: `${(i * 4.8 + (i % 3) * 2) % 100}%`,
            background: colors[i % colors.length],
            animationDuration: `${1.8 + (i % 4) * 0.5}s`,
            animationDelay: `${(i % 7) * 0.3}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function MonthlyDigest() {
  const { digests } = useStore()
  const { isAdmin, role } = useAuth()
  const isVibe = isAdmin || role === 'admin'

  const visible = isVibe
    ? [...(digests || [])].sort((a, b) => b.id.localeCompare(a.id))
    : [...(digests || [])].filter((d) => d.status === 'published').sort((a, b) => b.id.localeCompare(a.id))

  const [activeId, setActiveId] = useState(visible[0]?.id || null)
  const digest = visible.find((d) => d.id === activeId) || visible[0]

  if (visible.length === 0) {
    return (
      <div>
        <div className="page-head">
          <h1>Monthly Digest</h1>
          <p>El resumen mensual de VIBE.</p>
        </div>
        <div className="empty">No hay digests publicados todavia. El equipo VIBE esta preparando el proximo.</div>
      </div>
    )
  }

  const aurora = AURORA_THEMES[digest.auroraTheme] || AURORA_THEMES.default

  return (
    <div className="digest-aurora-wrap" style={{ backgroundImage: aurora.gradient }}>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: aurora.titleColor }}>{digest.title}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: aurora.titleColor, opacity: 0.8 }}>
            {digest.subtitle}
            {isVibe && digest.status === 'draft' && <span className="pill badge-warn" style={{ fontSize: 11 }}>Borrador</span>}
          </p>
        </div>
        {visible.length > 1 && (
          <select value={activeId || ''} onChange={(e) => setActiveId(e.target.value)} style={{ maxWidth: 220 }}>
            {visible.map((d) => <option key={d.id} value={d.id}>{d.subtitle}{d.status === 'draft' && isVibe ? ' (borrador)' : ''}</option>)}
          </select>
        )}
      </div>

      <div className="digest-body">
        {normalizeRows(digest.sections).map((row, idx) => (
          <motion.div
            key={row.id}
            className="digest-pub-row"
            initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.08 }}
          >
            {row.columns.map((col) => (
              <div key={col.id} className="digest-pub-col" style={{ flexGrow: col.span, flexBasis: 0, minWidth: 0 }}>
                <DigestBlock block={col.block} index={idx} />
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      {visible.length > 1 && (
        <div style={{ marginTop: 40 }}>
          <div className="section-title"><Icon name="clock" size={15} /><span>Ediciones anteriores</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {visible.filter((d) => d.id !== digest?.id).map((d) => (
              <button key={d.id} className="btn ghost sm" onClick={() => setActiveId(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {d.subtitle}
                {d.status === 'draft' && isVibe && <span className="pill badge-warn" style={{ fontSize: 9, padding: '1px 5px' }}>draft</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DigestBlock({ block, index }) {
  switch (block.type) {
    case 'heading': {
      const variant = block.variant || 'default'
      const align = block.align || 'left'
      const customStyle = {}
      if (variant === 'hero') {
        const stops = block.gradientStops && block.gradientStops.length >= 1 ? block.gradientStops : ['#9F86D7', '#D1A0E2', '#22d3ee']
        const dir = align === 'right' ? 'to left' : align === 'center' ? '90deg' : 'to right'
        customStyle.background = stops.length === 1 ? stops[0] : `linear-gradient(${dir}, ${stops.join(', ')})`
        customStyle.WebkitBackgroundClip = 'text'
        customStyle.backgroundClip = 'text'
        customStyle.color = 'transparent'
      } else if (variant === 'accent' && block.color) {
        customStyle.color = block.color
      }
      const showBar = variant === 'default' || variant === 'large'
      const barAlign = align === 'center' ? { margin: '8px auto 0' } : align === 'right' ? { marginLeft: 'auto', marginTop: 8 } : { marginTop: 8 }
      return (
        <div className="digest-h" style={{ textAlign: align }}>
          <div className={`digest-h-${variant}`} style={customStyle}>{block.text}</div>
          {showBar && <div className={`digest-h-bar bar-${variant}`} style={barAlign} />}
        </div>
      )
    }
    case 'text': {
      const sizes = { small: 13, normal: 15, large: 18, xl: 22 }
      const weights = { light: 300, normal: 400, bold: 700 }
      const style = {
        lineHeight: 1.7, maxWidth: 700, whiteSpace: 'pre-wrap', margin: '4px 0',
        fontSize: sizes[block.textSize] || 15,
        fontWeight: weights[block.textWeight] || 400,
        textAlign: block.textAlign || 'left',
        fontStyle: block.textStyle === 'italic' ? 'italic' : 'normal',
        color: block.textStyle === 'muted' ? 'var(--muted)' : 'var(--text)',
        opacity: block.textStyle === 'muted' ? 0.7 : 1,
      }
      if (block.textStyle === 'highlight') {
        style.background = 'rgba(159,134,215,0.1)'
        style.padding = '10px 14px'
        style.borderRadius = 'var(--radius)'
        style.borderLeft = '3px solid var(--vibe)'
      }
      if (block.textStyle === 'quote') {
        style.fontStyle = 'italic'
        style.paddingLeft = '16px'
        style.borderLeft = '2px solid var(--muted)'
        style.color = 'var(--muted)'
      }
      if (block.textAlign === 'center') style.margin = '4px auto'
      return <p style={style}>{(block.content || '').replace(/\\n/g, '\n')}</p>
    }
    case 'image':
      if (!block.src) return null
      return (
        <div style={{ margin: '16px 0' }}>
          <img
            src={block.src}
            alt={block.caption || ''}
            style={{
              width: `${block.width || 100}%`,
              maxHeight: block.maxHeight || 400,
              borderRadius: 'var(--radius)',
              objectFit: 'cover',
              objectPosition: block.imagePos || '50% 50%',
              display: 'block',
            }}
          />
          {block.caption && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{block.caption}</p>}
        </div>
      )
    case 'banner': {
      if (!block.src) return null
      const img = <img src={block.src} alt="" style={{ width: '100%', maxHeight: block.maxHeight || 300, objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block' }} />
      return block.link
        ? <a href={block.link} target="_blank" rel="noreferrer" style={{ display: 'block', margin: '16px 0' }}>{img}</a>
        : <div style={{ margin: '16px 0' }}>{img}</div>
    }
    case 'split': {
      const imgW = block.imageWidth || 240
      const titleVariant = block.titleVariant || 'default'
      const titleAlign = block.titleAlign || 'left'
      const titlePos = block.titlePosition || 'above-text'

      // estilo del titulo (misma logica que heading)
      const titleStyle = {}
      if (titleVariant === 'hero') {
        const stops = block.titleGradient && block.titleGradient.length >= 1 ? block.titleGradient : ['#9F86D7', '#22d3ee']
        const dir = titleAlign === 'right' ? 'to left' : titleAlign === 'center' ? '90deg' : 'to right'
        titleStyle.background = stops.length === 1 ? stops[0] : `linear-gradient(${dir}, ${stops.join(', ')})`
        titleStyle.WebkitBackgroundClip = 'text'
        titleStyle.backgroundClip = 'text'
        titleStyle.color = 'transparent'
      } else if (titleVariant === 'accent' && block.titleColor) {
        titleStyle.color = block.titleColor
      }

      const showTitleBar = titleVariant === 'default' || titleVariant === 'large'
      const titleBarAlign = titleAlign === 'center' ? { margin: '6px auto 0' } : titleAlign === 'right' ? { marginLeft: 'auto', marginTop: 6 } : { marginTop: 6 }
      const titleEl = block.title ? (
        <div style={{ textAlign: titleAlign, marginBottom: 8 }}>
          <div className={`digest-h-${titleVariant}`} style={titleStyle}>{block.title}</div>
          {showTitleBar && <div className={`digest-h-bar bar-${titleVariant}`} style={titleBarAlign} />}
        </div>
      ) : null

      const imgEl = block.src ? (
        <img src={block.src} alt="" className="digest-split-img" style={{ width: imgW, height: Math.round(imgW * 0.67), objectPosition: block.imagePos || '50% 50%' }} />
      ) : (
        <div className="digest-split-img skeleton" style={{ width: imgW, height: Math.round(imgW * 0.67) }} />
      )

      const textEl = <p style={{ whiteSpace: 'pre-wrap' }}>{(block.content || '').replace(/\\n/g, '\n')}</p>

      // construir columnas segun titlePosition
      if (titlePos === 'above-image') {
        // layout vertical: imagen arriba, titulo debajo de la imagen, texto debajo
        return (
          <div>
            {block.src ? (
              <img src={block.src} alt="" className="digest-split-img" style={{ width: '100%', maxWidth: imgW, height: Math.round(imgW * 0.67), objectPosition: block.imagePos || '50% 50%' }} />
            ) : (
              <div className="digest-split-img skeleton" style={{ width: '100%', maxWidth: imgW, height: Math.round(imgW * 0.67) }} />
            )}
            {titleEl}
            <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>{(block.content || '').replace(/\\n/g, '\n')}</p>
          </div>
        )
      }

      const imageCol = (
        <div style={{ flexShrink: 0 }}>
          {imgEl}
        </div>
      )
      const textCol = (
        <div className="digest-split-text">
          {titlePos === 'above-text' && titleEl}
          {textEl}
        </div>
      )

      return (
        <div>
          {titlePos === 'above-all' && titleEl}
          <div className="digest-split" style={{ flexDirection: block.imageSide === 'right' ? 'row-reverse' : 'row' }}>
            {imageCol}
            {textCol}
          </div>
        </div>
      )
    }
    case 'people': {
      const colors = block.kind === 'amaversaries' ? CONFETTI_AMAVERSARY : CONFETTI_BIRTHDAY
      const frameEffect = block.kind === 'amaversaries' ? 'gold' : (block.frameEffect || 'wave')
      return (
        <div className="digest-people-section">
          <Confetti colors={colors} count={24} />
          <div className="digest-people" style={{ position: 'relative', zIndex: 1 }}>
            {(block.entries || []).map((p, i) => {
              const frameClass = block.kind === 'amaversaries'
                ? 'digest-frame-gold'
                : frameEffect === 'none'
                  ? `digest-frame-${i % 4}`
                  : `digest-frame-${i % 4} digest-frame-${frameEffect}`
              return (
                <div key={i} className="digest-person">
                  <div className={`digest-person-frame ${frameClass}`}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="digest-person-img" />
                    ) : (
                      <div className="digest-person-img digest-person-placeholder">
                        {(p.name || p.login || '?').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="digest-person-name">{p.name || p.login}</div>
                  <div className="digest-person-meta">
                    {block.kind === 'amaversaries'
                      ? `${p.years} año${p.years === 1 ? '' : 's'}, ${p.day} de ${mesEs(block.month)}`
                      : `${p.day} de ${mesEs(block.month)}`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    case 'divider':
      return <hr className="digest-divider" />
    default:
      return null
  }
}
