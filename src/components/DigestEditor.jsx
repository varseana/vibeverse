import { useState, useRef, useEffect, useLayoutEffect, useCallback, Fragment } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors,
  useDroppable, pointerWithin, rectIntersection, getFirstCollision,
  MeasuringStrategy,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove,
  horizontalListSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  normalizeRows, locateColumn, containerOf, findRowIndex, moveColumn, reorderRows,
  extractColumnToNewRow, addBlockRow, addBlockColumn, removeColumn, updateColumnBlock,
  duplicateColumn, resizeColumn, MAX_COLS_PER_ROW,
} from '../lib/digestLayout.js'
import Icon from './Icon.jsx'
import ImagePositioner from './ImagePositioner.jsx'
import PhotoCropper from './PhotoCropper.jsx'
import { sfx } from '../lib/sfx.js'

// block types que el user puede agregar
const BLOCK_TYPES = [
  { type: 'heading', label: 'Titulo', icon: 'sparkles' },
  { type: 'text', label: 'Texto', icon: 'news' },
  { type: 'image', label: 'Imagen', icon: 'image' },
  { type: 'banner', label: 'Banner', icon: 'art' },
  { type: 'split', label: 'Imagen + Texto', icon: 'art' },
  { type: 'people', label: 'Personas', icon: 'users' },
  { type: 'divider', label: 'Separador', icon: 'star' },
]

function newBlock(type) {
  const id = 'sec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
  switch (type) {
    case 'heading': return { id, type, text: '', variant: 'default', align: 'left', color: '', gradientStops: ['#9F86D7', '#22d3ee'] }
    case 'text': return { id, type, content: '' }
    case 'image': return { id, type, src: '', imagePos: '50% 50%', width: 100, maxHeight: 400, caption: '' }
    case 'banner': return { id, type, src: '', link: '', maxHeight: 300 }
    case 'split': return { id, type, src: '', imagePos: '50% 50%', imageSide: 'left', imageWidth: 240, title: '', content: '' }
    case 'people': return { id, type, kind: 'birthdays', month: '', entries: [] }
    case 'divider': return { id, type }
    default: return { id, type }
  }
}

// Change a block's type in place, keeping its id and carrying over any content
// that maps across types (text stays text, an image src/caption is preserved,
// etc.). Anything the target type does not use falls back to newBlock defaults.
function changeBlockType(block, toType) {
  if (block.type === toType) return block
  const fresh = newBlock(toType)
  fresh.id = block.id
  // Best-effort content carry-over between the plain block shapes.
  const words = block.text || block.content || block.title || ''
  const img = block.src || ''
  const imgPos = block.imagePos || '50% 50%'
  const cap = block.caption || ''
  switch (toType) {
    case 'heading': return { ...fresh, text: words || block.title || '' }
    case 'text': return { ...fresh, content: words }
    case 'image': return { ...fresh, src: img, imagePos: imgPos, caption: cap || words }
    case 'banner': return { ...fresh, src: img, maxHeight: block.maxHeight || 300 }
    case 'split': return { ...fresh, src: img, imagePos: imgPos, title: block.title || '', content: block.content || block.text || '' }
    default: return fresh // people / divider: no meaningful carry-over
  }
}

// Human labels for the block-type chips shown in the picker and overlay.
const TYPE_LABEL = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b.label]))
const TYPE_ICON = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b.icon]))

// ---------------------------------------------------------------------------
// SortableColumn: a single block living inside a row. Draggable by its handle;
// drop it next to another column to sit side by side, or onto a rail to break
// it out into its own full-width row. One block per column (LEGO segment).
// ---------------------------------------------------------------------------
function SortableColumn({ column, rowId, canRemove, onUpdate, onRemove, onDuplicate, onResize, onChangeType, colCount }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column', rowId },
  })
  const [preview, setPreview] = useState(false)
  const changeRef = useRef(null)
  const [changing, setChanging] = useState(false)
  useEffect(() => {
    if (!changing) return
    const close = () => setChanging(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [changing])
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    flexGrow: column.span,
    flexBasis: 0,
    minWidth: 0,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={`digest-col ${isDragging ? 'dragging' : ''}`}>
      <div className="digest-col-bar">
        <div className="digest-col-handle" {...attributes} {...listeners} title="Arrastra para mover o crear columnas">
          <Icon name="target" size={13} />
        </div>
        <div className="digest-col-tools">
          {colCount > 1 && (
            <>
              <button className="btn ghost sm digest-col-tool" onClick={() => onResize(-1)} title="Mas angosta" disabled={column.span <= 1}>
                <Icon name="prev" size={12} />
              </button>
              <span className="digest-col-span" title="Ancho relativo">{column.span}</span>
              <button className="btn ghost sm digest-col-tool" onClick={() => onResize(1)} title="Mas ancha" disabled={column.span >= 4}>
                <Icon name="next" size={12} />
              </button>
            </>
          )}
          {/* cambiar tipo de bloque, preservando el contenido */}
          <div ref={changeRef} className="digest-col-change">
            <button
              className={`btn ghost sm digest-col-tool ${changing ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setChanging((v) => !v) }}
              title="Cambiar tipo de bloque"
            >
              <Icon name={TYPE_ICON[column.block.type] || 'sparkles'} size={12} />
            </button>
            {changing && (
              <BlockPicker
                title="Cambiar a"
                triggerRef={changeRef}
                activeType={column.block.type}
                onClose={() => setChanging(false)}
                onPick={(type) => { onChangeType(type); setChanging(false) }}
              />
            )}
          </div>
          <button className={`btn ghost sm digest-col-tool ${preview ? 'active' : ''}`} onClick={() => setPreview(!preview)} title={preview ? 'Editar' : 'Preview'}>
            <Icon name={preview ? 'settings' : 'external'} size={12} />
          </button>
          <button className="btn ghost sm digest-col-tool" onClick={onDuplicate} title="Duplicar">
            <Icon name="plus" size={12} />
          </button>
          <button className="btn ghost sm digest-col-tool digest-col-del" onClick={onRemove} title="Eliminar" disabled={!canRemove}>
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>
      <div className="digest-col-body">
        {preview ? <BlockPreview block={column.block} /> : <BlockEditor block={column.block} onUpdate={onUpdate} />}
      </div>
    </div>
  )
}

// A thin droppable seam BETWEEN columns (and at the row edges). Dropping a
// column here inserts it at that exact slot, opening space LEGO-style.
function ColumnGap({ rowId, index, active, full }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `gap:${rowId}:${index}`,
    data: { type: 'gap', rowId, index },
    disabled: full,
  })
  return (
    <div ref={setNodeRef} className={`digest-col-gap ${active ? 'armed' : ''} ${isOver ? 'over' : ''} ${full ? 'full' : ''}`}>
      <span className="digest-col-gap-line" />
    </div>
  )
}

// A horizontal rail BETWEEN rows. Dropping a column here breaks it out into a
// brand-new full-width row at that position.
function RailDroppable({ position, active }) {
  const { setNodeRef, isOver } = useDroppable({ id: `rail:${position}`, data: { type: 'rail', position } })
  return (
    <div ref={setNodeRef} className={`digest-row-rail ${active ? 'armed' : ''} ${isOver ? 'over' : ''}`}>
      <span className="digest-row-rail-line" />
      <span className="digest-row-rail-tip"><Icon name="plus" size={11} /> fila nueva</span>
    </div>
  )
}

// hero gradient editor: 2-5 bolitas de color que forman el gradiente
// cada bolita es un input type=color. minimo 1, maximo 5, default 2.
function HeroGradientEditor({ stops, onChange }) {
  const colors = (stops && stops.length >= 1) ? stops : ['#9F86D7', '#22d3ee']

  const updateStop = (i, val) => {
    const next = [...colors]
    next[i] = val
    onChange(next)
  }

  const addStop = () => {
    if (colors.length >= 5) return
    onChange([...colors, '#D1A0E2'])
  }

  const removeStop = (i) => {
    if (colors.length <= 1) return
    onChange(colors.filter((_, idx) => idx !== i))
  }

  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {colors.map((c, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <input
            type="color"
            value={c}
            onChange={(e) => updateStop(i, e.target.value)}
            title={`Color ${i + 1}`}
            style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', background: c, outline: '2px solid rgba(255,255,255,0.15)' }}
          />
          {colors.length > 1 && (
            <button
              onClick={() => removeStop(i)}
              style={{ position: 'absolute', top: -5, right: -5, width: 11, height: 11, borderRadius: '50%', background: 'var(--bad)', border: 'none', cursor: 'pointer', fontSize: 7, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              title="Quitar"
            >x</button>
          )}
        </div>
      ))}
      {colors.length < 5 && (
        <button
          onClick={addStop}
          style={{ width: 22, height: 22, borderRadius: '50%', border: '2px dashed rgba(159,134,215,0.4)', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Agregar color"
        >+</button>
      )}
    </div>
  )
}

// accent color picker: una sola bolita de color inline
function AccentColorPicker({ color, onChange }) {
  const useEyeDropper = async () => {
    if (!window.EyeDropper) return
    try {
      const dropper = new window.EyeDropper()
      const result = await dropper.open()
      onChange(result.sRGBHex)
    } catch { /* cancelled */ }
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        type="color"
        value={color || '#9F86D7'}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', background: color || '#9F86D7', outline: '2px solid rgba(255,255,255,0.15)' }}
        title="Color del titulo"
      />
      {window.EyeDropper && (
        <button className="btn ghost sm" onClick={useEyeDropper} title="Seleccionar de pantalla" style={{ padding: '2px 5px' }}>
          <Icon name="target" size={12} />
        </button>
      )}
    </div>
  )
}

// meses en espanol
const MESES_P = { January: 'Enero', February: 'Febrero', March: 'Marzo', April: 'Abril', May: 'Mayo', June: 'Junio', July: 'Julio', August: 'Agosto', September: 'Septiembre', October: 'Octubre', November: 'Noviembre', December: 'Diciembre' }
function mesEs(m) { return MESES_P[m] || m }

// preview real del bloque (como se ve en la vista publica)
function BlockPreview({ block }) {
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
        <div style={{ textAlign: align, margin: 0 }}>
          <div className={`digest-h-${variant}`} style={customStyle}>{block.text || '(sin titulo)'}</div>
          {showBar && <div className={`digest-h-bar bar-${variant}`} style={barAlign} />}
        </div>
      )
    }
    case 'text': {
      const sizes = { small: 12, normal: 14, large: 16, xl: 20 }
      const weights = { light: 300, normal: 400, bold: 700 }
      const style = {
        lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap',
        fontSize: sizes[block.textSize] || 14,
        fontWeight: weights[block.textWeight] || 400,
        textAlign: block.textAlign || 'left',
        fontStyle: block.textStyle === 'italic' || block.textStyle === 'quote' ? 'italic' : 'normal',
        color: block.textStyle === 'muted' ? 'var(--muted)' : 'var(--text)',
        opacity: block.textStyle === 'muted' ? 0.7 : 1,
      }
      if (block.textStyle === 'highlight') {
        style.background = 'rgba(159,134,215,0.1)'
        style.padding = '8px 12px'
        style.borderRadius = 'var(--radius-sm)'
        style.borderLeft = '3px solid var(--vibe)'
      }
      if (block.textStyle === 'quote') {
        style.paddingLeft = '14px'
        style.borderLeft = '2px solid var(--muted)'
        style.color = 'var(--muted)'
      }
      return <p style={style}>{(block.content || '(sin contenido)').replace(/\\n/g, '\n')}</p>
    }
    case 'image':
      if (!block.src) return <div className="muted" style={{ fontSize: 11 }}>(sin imagen)</div>
      return (
        <img src={block.src} alt="" style={{ width: `${block.width || 100}%`, maxHeight: block.maxHeight || 400, objectFit: 'cover', objectPosition: block.imagePos || '50% 50%', borderRadius: 'var(--radius)', display: 'block' }} />
      )
    case 'banner':
      if (!block.src) return <div className="muted" style={{ fontSize: 11 }}>(sin banner)</div>
      return <img src={block.src} alt="" style={{ width: '100%', maxHeight: block.maxHeight || 300, objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block' }} />
    case 'split': {
      const imgW = block.imageWidth || 240
      const tv = block.titleVariant || 'default'
      const ta = block.titleAlign || 'left'
      const tp = block.titlePosition || 'above-text'
      const titleStyle = {}
      if (tv === 'hero') {
        const stops = block.titleGradient && block.titleGradient.length >= 1 ? block.titleGradient : ['#9F86D7', '#22d3ee']
        const dir = ta === 'right' ? 'to left' : ta === 'center' ? '90deg' : 'to right'
        titleStyle.background = stops.length === 1 ? stops[0] : `linear-gradient(${dir}, ${stops.join(', ')})`
        titleStyle.WebkitBackgroundClip = 'text'; titleStyle.backgroundClip = 'text'; titleStyle.color = 'transparent'
      } else if (tv === 'accent' && block.titleColor) { titleStyle.color = block.titleColor }
      const showTBar = tv === 'default' || tv === 'large'
      const tBarAlign = ta === 'center' ? { margin: '6px auto 0' } : ta === 'right' ? { marginLeft: 'auto', marginTop: 6 } : { marginTop: 6 }
      const tEl = block.title ? <div style={{ textAlign: ta, marginBottom: 6 }}><div className={`digest-h-${tv}`} style={titleStyle}>{block.title}</div>{showTBar && <div className={`digest-h-bar bar-${tv}`} style={tBarAlign} />}</div> : null
      const imgEl = block.src
        ? <img src={block.src} alt="" style={{ width: imgW, height: Math.round(imgW * 0.67), objectFit: 'cover', objectPosition: block.imagePos || '50% 50%', borderRadius: 'var(--radius)', flexShrink: 0 }} />
        : <div style={{ width: imgW, height: Math.round(imgW * 0.67), background: 'var(--panel)', borderRadius: 'var(--radius)', flexShrink: 0 }} />
      const contentText = (block.content || '').replace(/\\n/g, '\n')
      return (
        <div>
          {tp === 'above-all' && tEl}
          {tp === 'above-image' ? (
            <div>
              {imgEl}
              {tEl}
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{contentText}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexDirection: block.imageSide === 'right' ? 'row-reverse' : 'row' }}>
              <div style={{ flexShrink: 0 }}>{imgEl}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {tp === 'above-text' && tEl}
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>{contentText}</p>
              </div>
            </div>
          )}
        </div>
      )
    }
    case 'people': {
      const frameEffect = block.kind === 'amaversaries' ? 'gold' : (block.frameEffect || 'wave')
      return (
        <div className="digest-people-section" style={{ position: 'relative' }}>
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
      return <hr style={{ border: 'none', height: 1, background: 'linear-gradient(90deg, transparent, var(--panel-brd), transparent)', margin: '8px 0' }} />
    default:
      return <div className="muted" style={{ fontSize: 11 }}>Bloque desconocido</div>
  }
}

// editor inline de cada bloque segun su type
function BlockEditor({ block, onUpdate }) {
  const up = (patch) => onUpdate({ ...block, ...patch })

  switch (block.type) {
    case 'heading':
      return (
        <div>
          <span className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Titulo</span>
          <input value={block.text || ''} onChange={(e) => up({ text: e.target.value })} placeholder="Titulo de seccion" />
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={block.variant || 'default'} onChange={(e) => up({ variant: e.target.value })} style={{ width: 100, flex: 'none' }}>
              <option value="default">Default</option>
              <option value="large">Large</option>
              <option value="hero">Hero</option>
              <option value="accent">Accent</option>
              <option value="subtle">Subtle</option>
            </select>
            <select value={block.align || 'left'} onChange={(e) => up({ align: e.target.value })} style={{ width: 90, flex: 'none' }}>
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
            {block.variant === 'hero' && (
              <HeroGradientEditor stops={block.gradientStops} onChange={(stops) => up({ gradientStops: stops })} />
            )}
            {block.variant === 'accent' && (
              <AccentColorPicker color={block.color || ''} onChange={(c) => up({ color: c })} />
            )}
          </div>
        </div>
      )
    case 'text':
      return (
        <div>
          <span className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Texto</span>
          <textarea value={block.content || ''} onChange={(e) => up({ content: e.target.value })} placeholder="Contenido del parrafo" rows={3} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={block.textSize || 'normal'} onChange={(e) => up({ textSize: e.target.value })} style={{ width: 80, flex: 'none', fontSize: 11 }}>
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="xl">XL</option>
            </select>
            <select value={block.textWeight || 'normal'} onChange={(e) => up({ textWeight: e.target.value })} style={{ width: 75, flex: 'none', fontSize: 11 }}>
              <option value="light">Light</option>
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
            <select value={block.textAlign || 'left'} onChange={(e) => up({ textAlign: e.target.value })} style={{ width: 80, flex: 'none', fontSize: 11 }}>
              <option value="left">Izq</option>
              <option value="center">Centro</option>
              <option value="right">Der</option>
            </select>
            <select value={block.textStyle || 'normal'} onChange={(e) => up({ textStyle: e.target.value })} style={{ width: 85, flex: 'none', fontSize: 11 }}>
              <option value="normal">Normal</option>
              <option value="italic">Italica</option>
              <option value="muted">Muted</option>
              <option value="highlight">Highlight</option>
              <option value="quote">Cita</option>
            </select>
          </div>
        </div>
      )
    case 'image':
      return (
        <div>
          <span className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Imagen</span>
          <input value={block.src || ''} onChange={(e) => up({ src: e.target.value })} placeholder="URL de la imagen" />
          {block.src && <ImagePositioner src={block.src} value={block.imagePos || '50% 50%'} onChange={(pos) => up({ imagePos: pos })} height={80} />}
          <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 10 }}>Ancho: {block.width || 100}%</label>
              <input type="range" min="20" max="100" step="5" value={block.width || 100} onChange={(e) => up({ width: parseInt(e.target.value) })} />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 10 }}>Alto max: {block.maxHeight || 400}px</label>
              <input type="range" min="150" max="500" step="25" value={block.maxHeight || 400} onChange={(e) => up({ maxHeight: parseInt(e.target.value) })} />
            </div>
          </div>
          <input value={block.caption || ''} onChange={(e) => up({ caption: e.target.value })} placeholder="Caption (opcional)" style={{ marginTop: 6 }} />
        </div>
      )
    case 'banner':
      return (
        <div>
          <span className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Banner (full-width, soporta GIF)</span>
          <input value={block.src || ''} onChange={(e) => up({ src: e.target.value })} placeholder="URL de imagen o GIF" />
          {block.src && (
            <img src={block.src} alt="" style={{ width: '100%', maxHeight: block.maxHeight || 300, objectFit: 'cover', borderRadius: 'var(--radius)', marginTop: 6 }} />
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
            <label style={{ fontSize: 10 }}>Alto max: {block.maxHeight || 300}px</label>
            <input type="range" min="100" max="500" step="25" value={block.maxHeight || 300} onChange={(e) => up({ maxHeight: parseInt(e.target.value) })} style={{ flex: 1 }} />
          </div>
          <input value={block.link || ''} onChange={(e) => up({ link: e.target.value })} placeholder="Link (opcional, al hacer click)" style={{ marginTop: 4 }} />
        </div>
      )
    case 'split':
      return <SplitBlockEditor block={block} up={up} />
    case 'people':
      return <PeopleBlockEditor block={block} onUpdate={up} />
    case 'divider':
      return <div className="muted" style={{ fontSize: 11, padding: '4px 0' }}>Separador visual</div>
    default:
      return <div className="muted">Bloque desconocido</div>
  }
}

// mini drop-zone por persona: boton + drag para asignar foto individual
function PersonBadgeDrop({ hasImage, onFile, onClear }) {
  const inputRef = useRef(null)

  const processImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onFile(reader.result)
    reader.readAsDataURL(file)
  }

  if (hasImage) {
    return (
      <button className="btn ghost sm" onClick={onClear} style={{ width: '100%', fontSize: 10, padding: '3px 0', color: 'var(--muted)' }}>
        <Icon name="trash" size={10} /> Quitar foto
      </button>
    )
  }

  return (
    <div
      style={{ padding: '4px', border: '1px dashed rgba(159,134,215,0.25)', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer', fontSize: 10, color: 'var(--muted)' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); processImage(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => processImage(e.target.files[0])} />
      <Icon name="image" size={11} /> Foto
    </div>
  )
}

// editor del bloque split: click en imagen abre cropper para ajustar
function SplitBlockEditor({ block, up }) {
  const [showCrop, setShowCrop] = useState(false)
  const imgW = block.imageWidth || 240
  const imgH = Math.round(imgW * 0.67)

  return (
    <div>
      <span className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Imagen + Texto</span>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <select value={block.imageSide || 'left'} onChange={(e) => up({ imageSide: e.target.value })} style={{ fontSize: 11 }}>
          <option value="left">Imagen izquierda</option>
          <option value="right">Imagen derecha</option>
        </select>
        <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <label style={{ fontSize: 10 }}>Ancho: {imgW}px</label>
          <input type="range" min="200" max="600" step="20" value={imgW} onChange={(e) => up({ imageWidth: parseInt(e.target.value) })} style={{ width: 80 }} />
        </div>
      </div>
      <input value={block.src || ''} onChange={(e) => up({ src: e.target.value })} placeholder="URL de la imagen" />
      {/* preview clickeable de la imagen */}
      {block.src && (
        <div
          style={{ marginTop: 6, cursor: 'pointer', position: 'relative', width: '100%', maxWidth: imgW, height: imgH, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid rgba(159,134,215,0.2)' }}
          onClick={() => setShowCrop(true)}
          title="Click para ajustar encuadre"
        >
          <img src={block.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: block.imagePos || '50% 50%' }} />
          <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 10, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
            Click para ajustar
          </div>
        </div>
      )}
      <input value={block.title || ''} onChange={(e) => up({ title: e.target.value })} placeholder="Titulo (opcional)" style={{ marginTop: 6 }} />
      {block.title && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={block.titlePosition || 'above-text'} onChange={(e) => up({ titlePosition: e.target.value })} style={{ width: 110, flex: 'none', fontSize: 11 }}>
            <option value="above-text">Sobre texto</option>
            <option value="above-image">Bajo imagen</option>
            <option value="above-all">Sobre todo</option>
          </select>
          <select value={block.titleVariant || 'default'} onChange={(e) => up({ titleVariant: e.target.value })} style={{ width: 90, flex: 'none', fontSize: 11 }}>
            <option value="default">Default</option>
            <option value="large">Large</option>
            <option value="hero">Hero</option>
            <option value="accent">Accent</option>
            <option value="subtle">Subtle</option>
          </select>
          <select value={block.titleAlign || 'left'} onChange={(e) => up({ titleAlign: e.target.value })} style={{ width: 80, flex: 'none', fontSize: 11 }}>
            <option value="left">Izq</option>
            <option value="center">Centro</option>
            <option value="right">Der</option>
          </select>
          {block.titleVariant === 'hero' && (
            <HeroGradientEditor stops={block.titleGradient} onChange={(stops) => up({ titleGradient: stops })} />
          )}
          {block.titleVariant === 'accent' && (
            <AccentColorPicker color={block.titleColor || ''} onChange={(c) => up({ titleColor: c })} />
          )}
        </div>
      )}
      <textarea value={block.content || ''} onChange={(e) => up({ content: e.target.value })} placeholder="Texto descriptivo" rows={2} style={{ marginTop: 4 }} />

      {/* cropper overlay */}
      {showCrop && block.src && (
        <PhotoCropper
          src={block.src}
          onDone={(cropped) => { up({ src: cropped }); setShowCrop(false) }}
          onCancel={() => setShowCrop(false)}
        />
      )}
    </div>
  )
}

// editor del bloque people (cumpleanos/amaversarios)
function PeopleBlockEditor({ block, onUpdate }) {
  const [newEntry, setNewEntry] = useState({ login: '', name: '', day: '', image: '', years: '' })
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [uploadResult, setUploadResult] = useState(null)
  const [croppingIdx, setCroppingIdx] = useState(null)
  const fileInputRef = useRef(null)

  // procesa multiples archivos de fotos, matchea por filename=login
  const handlePhotoFiles = async (files) => {
    if (!files || files.length === 0) return
    const entries = [...(block.entries || [])]
    let matched = 0
    let unmatched = 0

    const processFile = (file) => new Promise((resolve) => {
      // patron: hyperbadge_{login}.png o {login}.png : extraer login
      let login = file.name.replace(/\.[^.]+$/, '').toLowerCase()
      // quitar prefijos comunes de phonetool (hyperbadge_, badge_, photo_)
      login = login.replace(/^(hyperbadge_|badge_|photo_|phonetool_)/, '')
      const idx = entries.findIndex((e) => (e.login || '').toLowerCase() === login)
      if (idx === -1) { unmatched++; resolve(); return }

      const reader = new FileReader()
      reader.onload = () => {
        entries[idx] = { ...entries[idx], image: reader.result }
        matched++
        resolve()
      }
      reader.readAsDataURL(file)
    })

    for (const file of Array.from(files)) await processFile(file)
    onUpdate({ entries })
    setUploadResult({ matched, unmatched })
    setTimeout(() => setUploadResult(null), 4000)
  }

  const addEntry = () => {
    if (!newEntry.name && !newEntry.login) return
    const entry = { ...newEntry, day: parseInt(newEntry.day) || 1 }
    if (block.kind === 'amaversaries') entry.years = parseInt(newEntry.years) || 1
    onUpdate({ entries: [...(block.entries || []), entry] })
    setNewEntry({ login: '', name: '', day: '', image: '', years: '' })
  }

  const removeEntry = (idx) => {
    onUpdate({ entries: block.entries.filter((_, i) => i !== idx) })
  }

  const updateEntry = (idx, patch) => {
    onUpdate({ entries: block.entries.map((e, i) => (i === idx ? { ...e, ...patch } : e)) })
  }

  // bulk import: pegar multiples personas de una vez (formato: nombre, dia, login)
  const importBulk = () => {
    const lines = bulkText.split('\n').filter((l) => l.trim())
    const entries = lines.map((line) => {
      const parts = line.split(',').map((s) => s.trim())
      const entry = { name: parts[0] || '', day: parseInt(parts[1]) || 1, login: parts[2] || '', image: '' }
      if (block.kind === 'amaversaries') entry.years = parseInt(parts[3]) || 1
      return entry
    })
    if (entries.length > 0) {
      onUpdate({ entries: [...(block.entries || []), ...entries] })
      setBulkText('')
      setShowBulk(false)
    }
  }

  return (
    <div>
      <span className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Personas ({(block.entries || []).length})</span>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={block.kind || 'birthdays'} onChange={(e) => onUpdate({ kind: e.target.value })} style={{ width: 130, flex: 'none' }}>
          <option value="birthdays">Cumple Años</option>
          <option value="amaversaries">Amaversarios</option>
        </select>
        <input value={block.month || ''} onChange={(e) => onUpdate({ month: e.target.value })} placeholder="Mes (ej. July)" style={{ width: 100, flex: 'none' }} />
        {(block.kind || 'birthdays') === 'birthdays' && (
          <select value={block.frameEffect || 'wave'} onChange={(e) => onUpdate({ frameEffect: e.target.value })} style={{ width: 110, flex: 'none' }}>
            <option value="wave">Onda</option>
            <option value="shimmer">Shimmer</option>
            <option value="pulse">Pulse</option>
            <option value="none">Sin efecto</option>
          </select>
        )}
        <button className="btn ghost sm" onClick={() => setShowBulk(!showBulk)} title="Importar multiples" style={{ flex: 'none' }}>
          <Icon name="users" size={13} /> Bulk
        </button>
      </div>

      {/* bulk import */}
      {showBulk && (
        <div className="card" style={{ padding: 10, marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
            Pega una persona por linea: <code>Nombre, Dia, Login{block.kind === 'amaversaries' ? ', Anos' : ''}</code>
          </div>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={4} placeholder={`Maria Lopez, 15, mlopez${block.kind === 'amaversaries' ? ', 3' : ''}\nCarlos Ruiz, 22, cruiz${block.kind === 'amaversaries' ? ', 5' : ''}`} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="btn sm" onClick={importBulk}><Icon name="plus" size={13} /> Importar</button>
            <button className="btn ghost sm" onClick={() => setShowBulk(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* foto bulk upload: drag-and-drop de PNGs, matchea por filename=login */}
      {(block.entries || []).length > 0 && (
        <div
          style={{ padding: 10, marginBottom: 10, border: '1px dashed rgba(159,134,215,0.3)', borderRadius: 'var(--radius)', textAlign: 'center', cursor: 'pointer', background: uploadResult ? 'rgba(111,224,168,0.05)' : 'transparent', transition: 'background 0.3s' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handlePhotoFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handlePhotoFiles(e.target.files)} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="image" size={16} />
            <span style={{ fontSize: 12 }}>Arrastra fotos aqui o haz clic (archivos nombrados por login, ej. fiorejr.png)</span>
          </div>
          {uploadResult && (
            <div style={{ marginTop: 8, fontSize: 11 }}>
              <span style={{ color: 'var(--good)' }}>{uploadResult.matched} asignados</span>
              {uploadResult.unmatched > 0 && <span style={{ color: 'var(--warn)', marginLeft: 8 }}>{uploadResult.unmatched} sin match</span>}
            </div>
          )}
        </div>
      )}

      {/* grid de personas existentes */}
      {(block.entries || []).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6, marginBottom: 10, maxHeight: 300, overflowY: 'auto' }}>
          {block.entries.map((e, i) => (
            <div key={i} className="card" style={{ padding: 8, fontSize: 11 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                {e.image ? (
                  <img
                    src={e.image} alt=""
                    style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(159,134,215,0.3)' }}
                    onClick={() => setCroppingIdx(i)}
                    title="Click para ajustar"
                  />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
                    {(e.name || e.login || '?').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name || e.login}</div>
                  <div className="muted" style={{ fontSize: 10 }}>Dia {e.day}{block.kind === 'amaversaries' ? ` / ${e.years}a` : ''}</div>
                </div>
                <button className="btn ghost sm" onClick={() => removeEntry(i)} style={{ padding: 2, flexShrink: 0 }}><Icon name="trash" size={11} /></button>
              </div>
              {/* drop zone / boton para foto individual */}
              <PersonBadgeDrop
                hasImage={!!e.image}
                onFile={(dataUrl) => updateEntry(i, { image: dataUrl })}
                onClear={() => updateEntry(i, { image: '' })}
              />
            </div>
          ))}
        </div>
      )}

      {/* photo cropper overlay */}
      {croppingIdx !== null && block.entries[croppingIdx]?.image && (
        <PhotoCropper
          src={block.entries[croppingIdx].image}
          onDone={(cropped) => { updateEntry(croppingIdx, { image: cropped }); setCroppingIdx(null) }}
          onCancel={() => setCroppingIdx(null)}
        />
      )}

      {/* agregar persona individual */}
      <div style={{ padding: 10, background: 'rgba(159,134,215,0.06)', borderRadius: 'var(--radius)', border: '1px dashed rgba(159,134,215,0.2)' }}>
        <div className="muted" style={{ fontSize: 10, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Agregar persona</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label style={{ fontSize: 10 }}>Nombre</label>
            <input value={newEntry.name} onChange={(e) => setNewEntry((n) => ({ ...n, name: e.target.value }))} placeholder="Nombre" />
          </div>
          <div style={{ width: 80 }}>
            <label style={{ fontSize: 10 }}>Login</label>
            <input value={newEntry.login} onChange={(e) => setNewEntry((n) => ({ ...n, login: e.target.value }))} placeholder="login" />
          </div>
          <div style={{ width: 55 }}>
            <label style={{ fontSize: 10 }}>Dia</label>
            <input value={newEntry.day} onChange={(e) => setNewEntry((n) => ({ ...n, day: e.target.value }))} placeholder="15" />
          </div>
          {block.kind === 'amaversaries' && (
            <div style={{ width: 55 }}>
              <label style={{ fontSize: 10 }}>Anos</label>
              <input value={newEntry.years} onChange={(e) => setNewEntry((n) => ({ ...n, years: e.target.value }))} placeholder="3" />
            </div>
          )}
          <button className="btn sm" onClick={addEntry} style={{ height: 32 }}><Icon name="plus" size={13} /> Agregar</button>
        </div>
      </div>
    </div>
  )
}

const PICKER_W = 260   // matches .digest-picker-pop width
const PICKER_H = 190   // fallback height (header + 3-row chip grid) before measure
const VP_MARGIN = 8    // keep this far from any viewport edge

// Popover picker: the list of block types shown when the user taps a "+" slot.
// Rendered in a portal with fixed positioning so it escapes any ancestor
// overflow and can be flipped/clamped to stay fully on screen (clickable).
function BlockPicker({ title, triggerRef, onPick, onClose, activeType }) {
  const popRef = useRef(null)
  // Hidden until measured, so it never flashes at the wrong spot (e.g. an edge).
  const [place, setPlace] = useState({ left: 0, top: 0, openUp: false, ready: false })

  // Measure the real popover box and the trigger, then flip above when there is
  // no room below and clamp horizontally so the popover never lands off-screen.
  // Recompute on scroll/resize; Lenis drives smooth scroll on window, so a
  // capture-phase scroll listener catches it.
  useLayoutEffect(() => {
    const reposition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const popH = popRef.current?.offsetHeight || PICKER_H
      const popW = popRef.current?.offsetWidth || PICKER_W
      const spaceBelow = vh - rect.bottom
      const openUp = spaceBelow < popH + VP_MARGIN && rect.top > spaceBelow
      let left = rect.left + rect.width / 2 - popW / 2
      left = Math.max(VP_MARGIN, Math.min(left, vw - popW - VP_MARGIN))
      const top = openUp
        ? Math.max(VP_MARGIN, rect.top - popH - 6)
        : Math.min(rect.bottom + 6, vh - popH - VP_MARGIN)
      setPlace({ left, top, openUp, ready: true })
    }
    reposition()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [triggerRef])

  return createPortal(
    <div
      ref={popRef}
      className={`digest-picker-pop ${place.openUp ? 'up' : 'down'}`}
      style={{ left: place.left, top: place.top, visibility: place.ready ? 'visible' : 'hidden' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="digest-picker-head">
        <span>{title}</span>
        <button className="btn ghost sm" onClick={onClose} title="Cerrar"><Icon name="prev" size={12} /></button>
      </div>
      <div className="digest-picker-grid">
        {BLOCK_TYPES.map((bt) => (
          <button key={bt.type} className={`digest-picker-chip ${activeType === bt.type ? 'active' : ''}`} onClick={() => onPick(bt.type)}>
            <Icon name={bt.icon} size={18} />
            <span>{bt.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}

// Small "+" affordance that opens a BlockPicker. Used at the end of a row (add
// a column there) and as the standalone "add row" buttons.
function AddSlot({ label, title, variant, disabled, onPick }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])
  return (
    <div className={`digest-add-slot ${variant}`}>
      <button
        ref={triggerRef}
        className="digest-add-btn"
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        title={disabled ? 'La fila esta llena' : title}
      >
        <Icon name="plus" size={variant === 'col' ? 15 : 14} />
        {label && <span>{label}</span>}
      </button>
      {open && (
        <BlockPicker
          title={title}
          triggerRef={triggerRef}
          onClose={() => setOpen(false)}
          onPick={(type) => { onPick(type); setOpen(false) }}
        />
      )}
    </div>
  )
}

// componente principal del editor
export default function DigestEditor({ digest, onSave }) {
  // Normalize legacy flat blocks into the rows/columns model on read.
  const [rows, setRows] = useState(() => normalizeRows(digest.sections))
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'unsaved'
  const [activeId, setActiveId] = useState(null)
  const [preview, setPreview] = useState(false) // vista previa limpia (sin controles)
  const saveTimer = useRef(null)
  const clonedRows = useRef(null)      // snapshot to restore on cancel
  const lastOverId = useRef(null)
  const recentlyMovedToNewRow = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // debounced auto-save: guarda 1.5s despues del ultimo cambio
  const scheduleSave = (next) => {
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onSave(next)
      setSaveStatus('saving')
      setTimeout(() => { setSaveStatus('saved'); sfx.play('save') }, 300)
    }, 1500)
  }
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const commit = (next) => { setRows(next); scheduleSave(next) }

  // Reset the collision cache after items land in a new row.
  useEffect(() => {
    requestAnimationFrame(() => { recentlyMovedToNewRow.current = false })
  }, [rows])

  const activeColumn = activeId ? locateColumn(rows, activeId) : null
  const activeBlock = activeColumn ? rows[activeColumn.rowIndex].columns[activeColumn.colIndex].block : null

  // Collision detection tuned for multiple containers: prefer the pointer's
  // exact target (gaps and rails are thin), fall back to rect intersection,
  // then to the last known target so `over` never flickers to null mid-layout.
  const collisionDetection = useCallback((args) => {
    const pointer = pointerWithin(args)
    const intersections = pointer.length > 0 ? pointer : rectIntersection(args)
    let overId = getFirstCollision(intersections, 'id')
    if (overId != null) {
      lastOverId.current = overId
      return [{ id: overId }]
    }
    if (recentlyMovedToNewRow.current) lastOverId.current = activeId
    return lastOverId.current ? [{ id: lastOverId.current }] : []
  }, [activeId])

  const onDragStart = ({ active }) => {
    setActiveId(active.id)
    clonedRows.current = rows
  }

  // Live move between rows so columns visibly reflow while dragging.
  const onDragOver = ({ active, over }) => {
    if (!over) return
    const overId = over.id
    if (typeof overId === 'string' && (overId.startsWith('rail:') || overId.startsWith('gap:'))) return
    const activeRow = containerOf(rows, active.id)
    const overRow = containerOf(rows, overId)
    if (!activeRow || !overRow || activeRow === overRow) return
    const overLoc = locateColumn(rows, overId)
    const targetIndex = overLoc ? overLoc.colIndex : rows[findRowIndex(rows, overRow)].columns.length
    recentlyMovedToNewRow.current = true
    setRows((r) => moveColumn(r, active.id, overRow, targetIndex))
  }

  const onDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) { clonedRows.current = null; return }
    const overId = over.id

    // Drop on a rail -> break out into a new full-width row.
    if (typeof overId === 'string' && overId.startsWith('rail:')) {
      const position = parseInt(overId.split(':')[1], 10)
      commit(extractColumnToNewRow(rows, active.id, position))
      clonedRows.current = null
      return
    }
    // Drop on a gap -> insert at that exact column slot.
    if (typeof overId === 'string' && overId.startsWith('gap:')) {
      const [, rowId, idxStr] = overId.split(':')
      commit(moveColumn(rows, active.id, rowId, parseInt(idxStr, 10)))
      clonedRows.current = null
      return
    }

    const activeRow = containerOf(rows, active.id)
    const overRow = containerOf(rows, overId)
    // Reorder whole rows if a row handle landed on another row.
    if (rows.some((r) => r.id === active.id)) {
      commit(reorderRows(rows, active.id, overRow || overId))
      clonedRows.current = null
      return
    }
    // Reorder columns within the same row.
    if (activeRow && activeRow === overRow) {
      const overLoc = locateColumn(rows, overId)
      const activeLoc = locateColumn(rows, active.id)
      if (overLoc && activeLoc && overLoc.colIndex !== activeLoc.colIndex) {
        const rowIdx = activeLoc.rowIndex
        const next = rows.map((r) => ({ ...r, columns: [...r.columns] }))
        next[rowIdx].columns = arrayMove(next[rowIdx].columns, activeLoc.colIndex, overLoc.colIndex)
        commit(next)
        clonedRows.current = null
        return
      }
    }
    // onDragOver already handled cross-row moves; persist the current state.
    commit(rows)
    clonedRows.current = null
  }

  const onDragCancel = () => {
    if (clonedRows.current) setRows(clonedRows.current)
    setActiveId(null)
    clonedRows.current = null
  }

  const saveNow = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    onSave(rows)
    setSaveStatus('saved')
  }

  const dragging = activeId != null

  // Vista previa: render limpio (como la vista publica), sin handles ni DnD.
  if (preview) {
    return (
      <div className="digest-editor">
        <div className="digest-save-bar">
          <button className="btn sm" onClick={() => setPreview(false)}>
            <Icon name="settings" size={13} /> Salir de vista previa
          </button>
        </div>
        <div className="digest-preview-surface">
          {rows.map((row) => (
            <div key={row.id} className="digest-pub-row">
              {row.columns.map((col) => (
                <div key={col.id} className="digest-pub-col" style={{ flexGrow: col.span, flexBasis: 0, minWidth: 0 }}>
                  <BlockPreview block={col.block} />
                </div>
              ))}
            </div>
          ))}
          {rows.length === 0 && <div className="empty">Sin bloques todavia.</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="digest-editor">
      {/* indicador de auto-save + vista previa */}
      <div className="digest-save-bar">
        <span className={`digest-save-status ${saveStatus}`}>
          {saveStatus === 'saved' && <><Icon name="star" size={12} /> Guardado</>}
          {saveStatus === 'saving' && <><Icon name="clock" size={12} /> Guardando...</>}
          {saveStatus === 'unsaved' && <><Icon name="clock" size={12} /> Sin guardar</>}
        </span>
        {saveStatus === 'unsaved' && (
          <button className="btn ghost sm" onClick={saveNow}>Guardar ahora</button>
        )}
        <button className="btn ghost sm" onClick={() => { sfx.play('dash'); setPreview(true) }} title="Ver como quedara, sin controles">
          <Icon name="external" size={13} /> Vista previa
        </button>
      </div>

      <p className="digest-editor-hint muted">
        Arrastra un bloque por su manija: sueltalo al lado de otro para armar columnas, o en una
        franja horizontal para crear una fila nueva. Cambia el tipo con el icono de bloque, ajusta
        el ancho con las flechas, o usa Vista previa para verlo limpio.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        {/* rail: crear fila nueva al inicio */}
        <RailDroppable position={0} active={dragging} />

        {rows.map((row, ri) => (
          <div key={row.id}>
            <SortableRow
              row={row}
              dragging={dragging}
              onCommit={commit}
              rows={rows}
            />
            <RailDroppable position={ri + 1} active={dragging} />
          </div>
        ))}

        {createPortal(
          <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.18, 0.67, 0.32, 1.4)' }}>
            {activeBlock ? (
              <div className="digest-drag-overlay">
                <div className="digest-col-bar">
                  <div className="digest-col-handle"><Icon name="target" size={13} /></div>
                  <span className="digest-overlay-type"><Icon name={TYPE_ICON[activeBlock.type] || 'sparkles'} size={12} /> {TYPE_LABEL[activeBlock.type] || activeBlock.type}</span>
                </div>
                <div className="digest-col-body"><BlockPreview block={activeBlock} /></div>
              </div>
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

      {rows.length === 0 && <div className="empty">Sin bloques. Agrega el primero.</div>}

      {/* agregar fila nueva (abajo) */}
      <div className="digest-add-row-bar">
        <AddSlot
          variant="row"
          label="Agregar bloque"
          title="Elige un tipo de bloque"
          onPick={(type) => commit(addBlockRow(rows, newBlock(type), 'bottom'))}
        />
      </div>
    </div>
  )
}

// A row: a horizontal band of one or more columns, with gaps between them for
// precise drops and a "+" to add another column inline.
function SortableRow({ row, dragging, onCommit, rows }) {
  const { setNodeRef } = useDroppable({ id: row.id, data: { type: 'row' } })
  const colCount = row.columns.length
  const full = colCount >= MAX_COLS_PER_ROW

  return (
    <div ref={setNodeRef} className={`digest-row ${dragging ? 'dragging-active' : ''}`}>
      <SortableContext items={row.columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
        <ColumnGap rowId={row.id} index={0} active={dragging} full={full} />
        {row.columns.map((col, ci) => (
          <Fragment key={col.id}>
            <SortableColumn
              column={col}
              rowId={row.id}
              colCount={colCount}
              canRemove={rows.length > 1 || colCount > 1}
              onUpdate={(block) => onCommit(updateColumnBlock(rows, col.id, block))}
              onRemove={() => onCommit(removeColumn(rows, col.id))}
              onDuplicate={() => onCommit(duplicateColumn(rows, col.id))}
              onResize={(dir) => onCommit(resizeColumn(rows, col.id, dir))}
              onChangeType={(type) => onCommit(updateColumnBlock(rows, col.id, changeBlockType(col.block, type)))}
            />
            <ColumnGap rowId={row.id} index={ci + 1} active={dragging} full={full} />
          </Fragment>
        ))}
      </SortableContext>
      {!full && !dragging && (
        <AddSlot
          variant="col"
          title="Agregar columna"
          onPick={(type) => onCommit(addBlockColumn(rows, row.id, colCount, newBlock(type)))}
        />
      )}
    </div>
  )
}
