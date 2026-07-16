import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { ROLE_ALLOWLIST, LINK_ICON_OPTIONS, CADENCES } from '../data/seed.js'
import { ROLES } from '../lib/auth.jsx'
import { useStore } from '../lib/store.jsx'
import Icon from '../components/Icon.jsx'
import ImageEditor from '../components/ImageEditor.jsx'

// Admin back-office. Edits persist to localStorage via the store and show up
// live on the public pages. In production each action becomes an API call.
const TABS = ['Flyers', 'AI Ally', 'Noticias', 'Calendario', 'Sugerencias', 'Trivias', 'Cumpleanos', 'Accesos rapidos', 'Premios', 'Roles']

export default function Admin() {
  const [params] = useSearchParams()
  const initial = TABS.includes(params.get('tab')) ? params.get('tab') : 'Flyers'
  const [tab, setTab] = useState(initial)
  const store = useStore()

  return (
    <div>
      <div className="page-head">
        <h1>Panel de Administracion</h1>
        <p>Gestiona el contenido de VIBEverse. Solo equipo VIBE.</p>
      </div>

      <div className="nav" style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <a key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)} style={{ cursor: 'pointer' }}>{t}</a>
        ))}
        <div className="spacer" />
        <a onClick={store.reset} style={{ cursor: 'pointer' }} className="muted">Restaurar por defecto</a>
      </div>

      {tab === 'Flyers' && <FlyersAdmin />}
      {tab === 'AI Ally' && <AiAllyAdmin />}
      {tab === 'Noticias' && <NewsAdmin />}
      {tab === 'Calendario' && <EventsAdmin />}
      {tab === 'Sugerencias' && <SuggestionsAdmin />}
      {tab === 'Trivias' && <TriviasAdmin />}
      {tab === 'Cumpleanos' && <PeopleAdmin />}
      {tab === 'Accesos rapidos' && <LinksAdmin />}
      {tab === 'Premios' && <AwardsAdmin />}
      {tab === 'Roles' && <RolesAdmin />}
    </div>
  )
}

/* --------------------------- Flyers --------------------------- */
function FlyersAdmin() {
  const { flyers, add, update, remove, setHomeFlyer } = useStore()
  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')
  const [link, setLink] = useState('')
  const [listRef] = useAutoAnimate()
  // editor holds which flyer we are editing: 'new' for the add form, or a flyer id.
  const [editor, setEditor] = useState(null)

  const addFlyer = () => {
    if (!title || !image) return
    add('flyers', { title, image, link, isHome: false })
    setTitle(''); setImage(''); setLink('')
  }

  const onEditorDone = (dataUrl) => {
    if (editor === 'new') setImage(dataUrl)
    else if (editor) update('flyers', editor, { image: dataUrl })
    setEditor(null)
  }

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Nuevo flyer</h3>
        <label>Titulo</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del flyer" />

        <label>Imagen</label>
        {image ? (
          <img src={image} alt="preview" className="flyer-thumb" onError={(e) => (e.target.style.display = 'none')} />
        ) : (
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Sube una imagen y ajustala al formato del carrusel.</div>
        )}
        <button className="btn ghost sm" onClick={() => setEditor('new')}>
          <Icon name="image" size={14} /> {image ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        <div className="muted" style={{ fontSize: 11, margin: '10px 0 4px' }}>o pega una URL</div>
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://... o data:image/..." />

        <label>Hyperlink (opcional)</label>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        <button className="btn" style={{ marginTop: 14 }} onClick={addFlyer}><Icon name="plus" size={16} /> Agregar al carrusel</button>
      </div>

      <div ref={listRef}>
        {flyers.map((f) => (
          <div key={f.id} className="card" style={{ marginBottom: 12 }}>
            <img src={f.image} alt={f.title} className="flyer-thumb" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <strong style={{ flex: 1 }}>{f.title}</strong>
              {f.isHome && <span className="home-badge">HOME</span>}
            </div>
            <label>Titulo</label>
            <input value={f.title} onChange={(e) => update('flyers', f.id, { title: e.target.value })} />
            <label>Hyperlink</label>
            <input value={f.link} onChange={(e) => update('flyers', f.id, { link: e.target.value })} placeholder="Sin link" />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn ghost sm" onClick={() => setEditor(f.id)}><Icon name="image" size={14} /> Editar imagen</button>
              {!f.isHome && <button className="btn ghost sm" onClick={() => setHomeFlyer(f.id)}><Icon name="home" size={14} /> Marcar como Home</button>}
              <button className="btn ghost sm" onClick={() => remove('flyers', f.id)}><Icon name="trash" size={14} /> Eliminar</button>
            </div>
          </div>
        ))}
        {flyers.length === 0 && <div className="empty">No hay flyers. Agrega el primero.</div>}
      </div>

      {editor && <ImageEditor onDone={onEditorDone} onCancel={() => setEditor(null)} />}
    </div>
  )
}

/* --------------------------- News --------------------------- */
function NewsAdmin() {
  const { news, add, update, remove } = useStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('Noticia')
  const [listRef] = useAutoAnimate()

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Nueva noticia</h3>
        <label>Titulo</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>Etiqueta</label>
        <input value={tag} onChange={(e) => setTag(e.target.value)} />
        <label>Cuerpo</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="btn" style={{ marginTop: 12 }} onClick={() => {
          if (!title) return
          add('news', { title, body, tag, date: '2026-07-15', pinned: false })
          setTitle(''); setBody('')
        }}><Icon name="plus" size={16} /> Publicar</button>
      </div>
      <div ref={listRef}>
        {news.map((n) => (
          <div key={n.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="tag" style={{ margin: 0 }}>{n.tag}</span>
              {n.pinned && <span className="home-badge">DESTACADA</span>}
              <div className="spacer" />
              <button className="btn ghost sm" onClick={() => {
                update('news', n.id, { pinned: !n.pinned })
                if (!n.pinned) news.filter((x) => x.id !== n.id && x.pinned).forEach((x) => update('news', x.id, { pinned: false }))
              }}>{n.pinned ? 'Quitar destacada' : 'Destacar'}</button>
              <button className="btn ghost sm" onClick={() => remove('news', n.id)}>Borrar</button>
            </div>
            <label>Titulo</label>
            <input value={n.title} onChange={(e) => update('news', n.id, { title: e.target.value })} />
            <label>Cuerpo</label>
            <textarea value={n.body} onChange={(e) => update('news', n.id, { body: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------- Events --------------------------- */
const EVENT_AR = 16 / 9 // event card image ratio

function EventsAdmin() {
  const { events, add, update, remove } = useStore()
  const [listRef] = useAutoAnimate()
  const blank = { title: '', date: '2026-07-20', endDate: '', type: 'Evento', owner: 'varseana', deadline: '', deadlineLabel: '', image: '', imageMode: 'blur', imageOpacity: 0.5 }
  const [form, setForm] = useState(blank)
  const [editorFor, setEditorFor] = useState(null) // 'new' | event id | null
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addEvent = () => {
    if (!form.title || !form.date) return
    // Only persist optional fields when filled, keeping records clean.
    const ev = { title: form.title, date: form.date, type: form.type, owner: form.owner || 'varseana' }
    if (form.endDate) ev.endDate = form.endDate
    if (form.deadline) { ev.deadline = form.deadline; ev.deadlineLabel = form.deadlineLabel || 'Deadline' }
    if (form.image) { ev.image = form.image; ev.imageMode = form.imageMode; ev.imageOpacity = form.imageOpacity }
    add('events', ev)
    setForm(blank)
  }

  // ImageEditor result routes to either the new-event form or an existing event.
  const onEditorDone = (dataUrl) => {
    if (editorFor === 'new') set('image', dataUrl)
    else if (editorFor) update('events', editorFor, { image: dataUrl })
    setEditorFor(null)
  }

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Nuevo evento o actividad</h3>
        <label>Titulo</label>
        <input value={form.title} maxLength={50} onChange={(e) => set('title', e.target.value)} />
        <div className="char-count" style={{ color: form.title.length >= 50 ? 'var(--warn)' : 'var(--muted)' }}>
          {form.title.length}/50
        </div>

        <label>Fecha de inicio</label>
        <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />

        <label>Fecha de fin (opcional, para eventos de varios dias)</label>
        <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />

        <label>Tipo</label>
        <select value={form.type} onChange={(e) => set('type', e.target.value)}>
          {['Evento', 'Trivia', 'En vivo', 'Flyer', 'Concurso', 'Deadline'].map((t) => <option key={t}>{t}</option>)}
        </select>

        <label>Owner (login)</label>
        <input value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="ej. varseana" />

        {/* Optional event image with display options */}
        <label>Imagen del evento (opcional)</label>
        {form.image
          ? <img src={form.image} alt="preview" className="flyer-thumb" style={{ aspectRatio: '16 / 9' }} />
          : <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Sube una imagen y ajusta como se vera detras de la tarjeta.</div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn ghost sm" onClick={() => setEditorFor('new')}>
            <Icon name="image" size={14} /> {form.image ? 'Cambiar imagen' : 'Subir imagen'}
          </button>
          {form.image && <button className="btn ghost sm" onClick={() => set('image', '')}><Icon name="trash" size={14} /> Quitar</button>}
        </div>
        {form.image && <EventImageOptions mode={form.imageMode} opacity={form.imageOpacity}
          onMode={(m) => set('imageMode', m)} onOpacity={(o) => set('imageOpacity', o)} />}

        <div className="notice" style={{ margin: '14px 0 4px', fontSize: 12 }}>
          Deadline opcional: un cierre de inscripcion o de envio (ej. concurso, RSVP).
        </div>
        <label>Fecha limite (deadline, opcional)</label>
        <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
        <label>Que significa el deadline</label>
        <input value={form.deadlineLabel} onChange={(e) => set('deadlineLabel', e.target.value)} placeholder="ej. Cierre de inscripcion" />

        <button className="btn" style={{ marginTop: 14 }} onClick={addEvent}><Icon name="plus" size={16} /> Agregar</button>
      </div>

      <div ref={listRef}>
        {events.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((e) => (
          <div key={e.id} className="card" style={{ marginBottom: 10 }}>
            {e.image && (
              <div style={{ marginBottom: 8 }}>
                <img src={e.image} alt="" className="flyer-thumb" style={{ aspectRatio: '16 / 9', filter: e.imageMode === 'blur' ? 'blur(2px)' : 'none', opacity: e.imageOpacity ?? 0.5 }} />
                <EventImageOptions mode={e.imageMode || 'blur'} opacity={e.imageOpacity ?? 0.5}
                  onMode={(m) => update('events', e.id, { imageMode: m })}
                  onOpacity={(o) => update('events', e.id, { imageOpacity: o })} />
                <button className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => setEditorFor(e.id)}><Icon name="image" size={14} /> Cambiar imagen</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="tag" style={{ margin: 0 }}><Icon name="calendar" size={12} /> {e.type}</span>
              <strong style={{ flex: 1 }}>{e.title}</strong>
              <button className="btn ghost sm" onClick={() => remove('events', e.id)}><Icon name="trash" size={14} /></button>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {e.date}{e.endDate ? ` al ${e.endDate}` : ''}, owner {e.owner}
            </div>
            {e.deadline && (
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                <Icon name="clock" size={11} /> {e.deadlineLabel || 'Deadline'}: {e.deadline}
              </div>
            )}
            {!e.image && (
              <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => setEditorFor(e.id)}>
                <Icon name="image" size={14} /> Subir imagen
              </button>
            )}
          </div>
        ))}
      </div>

      {editorFor && (
        <ImageEditor
          aspectRatio={EVENT_AR}
          outWidth={960}
          title="Imagen del evento"
          onDone={onEditorDone}
          onCancel={() => setEditorFor(null)}
        />
      )}
    </div>
  )
}

// Controls for how an event image is displayed: blurred, solid, and opacity %.
function EventImageOptions({ mode, opacity, onMode, onOpacity }) {
  return (
    <div className="img-opts">
      <div className="img-opts-modes">
        <button type="button" className={mode === 'blur' ? 'active' : ''} onClick={() => onMode('blur')}>Difuminada</button>
        <button type="button" className={mode === 'solid' ? 'active' : ''} onClick={() => onMode('solid')}>Solida</button>
      </div>
      <label style={{ marginTop: 8 }}>Opacidad: {Math.round((opacity ?? 0.5) * 100)}%</label>
      <input type="range" min="0.1" max="1" step="0.05" value={opacity ?? 0.5}
        onChange={(e) => onOpacity(parseFloat(e.target.value))} style={{ width: '100%' }} />
    </div>
  )
}

/* --------------------------- Quick links --------------------------- */
function LinksAdmin() {
  const { links, add, update, remove } = useStore()
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [icon, setIcon] = useState('link')
  const [managerOnly, setManagerOnly] = useState(false)
  const [listRef] = useAutoAnimate()

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Nuevo acceso rapido</h3>
        <label>Etiqueta</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} />
        <label>URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        <label>Icono</label>
        <div className="icon-picker">
          {LINK_ICON_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`icon-opt ${icon === opt ? 'active' : ''}`}
              onClick={() => setIcon(opt)}
              title={opt}
            >
              <Icon name={opt} size={20} />
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={managerOnly} onChange={(e) => setManagerOnly(e.target.checked)} />
          Solo para managers
        </label>
        <button className="btn" style={{ marginTop: 12 }} onClick={() => {
          if (!label || !url) return
          add('links', { label, url, icon, category: 'Recursos', managerOnly })
          setLabel(''); setUrl(''); setIcon('link'); setManagerOnly(false)
        }}><Icon name="plus" size={16} /> Agregar</button>
      </div>
      <div ref={listRef}>
        {links.map((l) => (
          <div key={l.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="ql-icon" style={{ width: 36, height: 36, margin: 0 }}><Icon name={l.icon} size={18} /></span>
              <strong style={{ flex: 1 }}>{l.label}</strong>
              {l.managerOnly && <span className="pill">Managers</span>}
              <button className="btn ghost sm" onClick={() => remove('links', l.id)}><Icon name="trash" size={14} /> Eliminar</button>
            </div>
            <label>Etiqueta</label>
            <input value={l.label} onChange={(e) => update('links', l.id, { label: e.target.value })} />
            <label>URL</label>
            <input value={l.url} onChange={(e) => update('links', l.id, { url: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------- AI is your ally (magazine editions) --------------------------- */
function AiAllyAdmin() {
  const { aiEditions, add, remove, update, setCurrentEdition } = useStore()
  const [listRef] = useAutoAnimate()
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState('')

  // Newest first: freshly-added ids ("aiEditions_<ts>") sort ahead of seed
  // month ids ("2026-07") since letters sort after digits.
  const editions = [...(aiEditions || [])].sort((a, b) => b.id.localeCompare(a.id))

  // Read an uploaded file as a data URL (stored inline for the demo).
  const readFile = (file) => new Promise((res) => {
    const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file)
  })

  const addPdfEdition = async (file) => {
    if (!file || !label) return
    setBusy('Cargando PDF...')
    const pdf = await readFile(file)
    add('aiEditions', { label, kind: 'pdf', pdf, current: false })
    setLabel(''); setBusy('')
  }

  const addImageEdition = async (files) => {
    if (!files?.length || !label) return
    setBusy('Cargando imagenes...')
    const pages = await Promise.all(Array.from(files).map(readFile))
    add('aiEditions', { label, kind: 'images', pages, current: false })
    setLabel(''); setBusy('')
  }

  const makeCurrent = (id) => setCurrentEdition(id)

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Nueva edicion mensual</h3>
        <div className="notice" style={{ fontSize: 12, margin: '4px 0 12px' }}>
          Sube un PDF con todas las paginas (recomendado) o varias imagenes 800x1131.
          Las ediciones anteriores se conservan y el lector puede navegarlas.
        </div>
        <label>Etiqueta del mes</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ej. Agosto 2026" />

        <label>Opcion A: subir PDF</label>
        <input type="file" accept="application/pdf" disabled={!label} onChange={(e) => addPdfEdition(e.target.files[0])} />

        <label style={{ marginTop: 10 }}>Opcion B: subir imagenes (800x1131)</label>
        <input type="file" accept="image/*" multiple disabled={!label} onChange={(e) => addImageEdition(e.target.files)} />

        {busy && <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>{busy}</p>}
        {!label && <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>Escribe la etiqueta antes de subir.</p>}
      </div>

      <div ref={listRef}>
        {editions.length === 0 && <div className="empty">No hay ediciones. Sube la primera.</div>}
        {editions.map((ed) => (
          <div key={ed.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag" style={{ margin: 0 }}><Icon name="idea" size={12} /> {ed.kind === 'pdf' ? 'PDF' : `${ed.pages?.length || 0} img`}</span>
              <strong style={{ flex: 1 }}>{ed.label}</strong>
              {ed.current && <span className="home-badge">ACTUAL</span>}
            </div>
            <label>Etiqueta</label>
            <input value={ed.label} onChange={(e) => update('aiEditions', ed.id, { label: e.target.value })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {!ed.current && <button className="btn ghost sm" onClick={() => makeCurrent(ed.id)}><Icon name="star" size={14} /> Marcar como actual</button>}
              <button className="btn ghost sm" onClick={() => remove('aiEditions', ed.id)}><Icon name="trash" size={14} /> Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------- Awards (modular catalog) --------------------------- */
const AWARD_ICONS = ['award', 'trophy', 'star', 'sparkles', 'idea', 'users']

function AwardsAdmin() {
  const { awards, add, update, remove, addAward, toggleAwardActive } = useStore()
  const navigate = useNavigate()
  const [listRef] = useAutoAnimate()
  const [editing, setEditing] = useState(null) // award id being edited, or 'new'

  const blank = { name: '', cadence: 'Monthly', icon: 'award', description: '', why: '', eligibility: '', example: '', active: true }
  const [draft, setDraft] = useState(blank)

  const startNew = () => { setDraft(blank); setEditing('new') }
  const startEdit = (a) => { setDraft(a); setEditing(a.id) }
  const save = () => {
    if (!draft.name) return
    if (editing === 'new') addAward(draft)
    else update('awards', editing, draft)
    setEditing(null); setDraft(blank)
  }

  return (
    <div>
      <div className="notice" style={{ marginBottom: 16 }}>
        Catalogo modular de premios. Editar nombre, descripcion o criterios se refleja al instante en
        los dropdowns y en la Guia de premios. Archivar un premio lo quita de nuevas nominaciones pero
        conserva el historial. Esto sera la tabla vibe-awards en DynamoDB.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <button className="btn ghost" onClick={() => navigate('/rewards?tab=guide')}><Icon name="idea" size={16} /> Ver guia de premios</button>
        <button className="btn" onClick={startNew}><Icon name="plus" size={16} /> Nuevo premio</button>
      </div>

      <div ref={listRef}>
        {CADENCES.map((cad) => {
          const list = awards.filter((a) => a.cadence === cad).sort((x, y) => (x.order || 0) - (y.order || 0))
          if (list.length === 0) return null
          return (
            <div key={cad} style={{ marginBottom: 18 }}>
              <div className="section-title" style={{ marginTop: 8 }}><Icon name="award" size={14} /><span>{cad}</span></div>
              {list.map((a) => (
                <div key={a.id} className="card" style={{ marginBottom: 8, opacity: a.active ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="guide-ico" style={{ width: 32, height: 32 }}><Icon name={a.icon} size={16} /></span>
                    <div style={{ flex: 1 }}>
                      <strong>{a.name}</strong>
                      {!a.active && <span className="pill" style={{ marginLeft: 8 }}>Archivado</span>}
                      <div className="muted" style={{ fontSize: 12 }}>{a.description}</div>
                    </div>
                    <button className="btn ghost sm" onClick={() => startEdit(a)}>Editar</button>
                    <button className="btn ghost sm" onClick={() => toggleAwardActive(a.id)}>{a.active ? 'Archivar' : 'Reactivar'}</button>
                    <button className="btn ghost sm" onClick={() => remove('awards', a.id)}><Icon name="trash" size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2>{editing === 'new' ? 'Nuevo premio' : 'Editar premio'}</h2>
            <label>Nombre</label>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="ej. Summit Star" />
            <label>Cadencia</label>
            <select value={draft.cadence} onChange={(e) => setDraft({ ...draft, cadence: e.target.value })}>
              {CADENCES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <label>Icono</label>
            <div className="icon-picker" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {AWARD_ICONS.map((opt) => (
                <button key={opt} type="button" className={`icon-opt ${draft.icon === opt ? 'active' : ''}`} onClick={() => setDraft({ ...draft, icon: opt })} title={opt}>
                  <Icon name={opt} size={18} />
                </button>
              ))}
            </div>
            <label>Descripcion (que es)</label>
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <label>Por que se da</label>
            <textarea value={draft.why} onChange={(e) => setDraft({ ...draft, why: e.target.value })} />
            <label>Quien califica</label>
            <input value={draft.eligibility} onChange={(e) => setDraft({ ...draft, eligibility: e.target.value })} />
            <label>Ejemplo de nominacion (opcional)</label>
            <textarea value={draft.example} onChange={(e) => setDraft({ ...draft, example: e.target.value })} />
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn" disabled={!draft.name} onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* --------------------------- Activity suggestions (from users) --------------------------- */
function SuggestionsAdmin() {
  const { suggestions, add, update, remove } = useStore()
  const [listRef] = useAutoAnimate()

  // Turn a user suggestion into a real calendar event (VIBE fills in the rest later).
  const toEvent = (s) => {
    add('events', { title: s.title, date: s.date || '2026-07-20', type: 'Evento', owner: 'varseana' })
    update('suggestions', s.id, { status: 'agregada' })
  }

  const pending = suggestions.filter((s) => s.status !== 'agregada' && s.status !== 'descartada')
  const done = suggestions.filter((s) => s.status === 'agregada' || s.status === 'descartada')

  return (
    <div>
      <div className="notice" style={{ marginBottom: 16, fontSize: 13 }}>
        Actividades que los usuarios reportan desde el calendario. Revisalas y, si aplican,
        agregalas al calendario con un clic.
      </div>

      {suggestions.length === 0 && <div className="empty">No hay sugerencias todavia.</div>}

      <div ref={listRef}>
        {pending.map((s) => (
          <div key={s.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="tag" style={{ margin: 0 }}><Icon name="idea" size={12} /> Nueva</span>
              <strong style={{ flex: 1 }}>{s.title}</strong>
              <span className="muted" style={{ fontSize: 12 }}>por {s.by}</span>
            </div>
            {s.date && <div className="muted" style={{ fontSize: 13 }}>Fecha aprox: {s.date}</div>}
            {s.note && <p style={{ fontSize: 14, marginTop: 4 }}>{s.note}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn sm" onClick={() => toEvent(s)}><Icon name="plus" size={14} /> Agregar al calendario</button>
              <button className="btn ghost sm" onClick={() => update('suggestions', s.id, { status: 'descartada' })}>Descartar</button>
              <button className="btn ghost sm" onClick={() => remove('suggestions', s.id)}><Icon name="trash" size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 20 }}><Icon name="trophy" size={14} /><span>Procesadas</span></div>
          <div ref={listRef}>
            {done.map((s) => (
              <div key={s.id} className="card" style={{ marginBottom: 8, opacity: 0.65 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`pill ${s.status === 'agregada' ? 'badge-good' : ''}`}>{s.status}</span>
                  <strong style={{ flex: 1 }}>{s.title}</strong>
                  <button className="btn ghost sm" onClick={() => remove('suggestions', s.id)}><Icon name="trash" size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* --------------------------- Trivias --------------------------- */
function TriviasAdmin() {
  const { trivias, add, update, remove } = useStore()
  const [listRef] = useAutoAnimate()
  const blank = { title: '', description: '', url: '', opensAt: '2026-07-20', closesAt: '2026-07-27' }
  const [form, setForm] = useState(blank)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addTrivia = () => {
    if (!form.title || !form.url) return
    add('trivias', { ...form })
    setForm(blank)
  }

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Nueva trivia</h3>
        <div className="notice" style={{ fontSize: 12, margin: '4px 0 12px' }}>
          Las trivias enlazan a un Microsoft Form. No se califican dentro de VIBEverse.
        </div>
        <label>Titulo</label>
        <input value={form.title} onChange={(e) => set('title', e.target.value)} />
        <label>Descripcion</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
        <label>Link al Form</label>
        <input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://forms.office.com/r/..." />
        <label>Abre</label>
        <input type="date" value={form.opensAt} onChange={(e) => set('opensAt', e.target.value)} />
        <label>Cierra</label>
        <input type="date" value={form.closesAt} onChange={(e) => set('closesAt', e.target.value)} />
        <button className="btn" style={{ marginTop: 14 }} onClick={addTrivia}><Icon name="plus" size={16} /> Publicar trivia</button>
      </div>

      <div ref={listRef}>
        {trivias.length === 0 && <div className="empty">No hay trivias. Crea la primera.</div>}
        {trivias.map((t) => (
          <div key={t.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="tag" style={{ margin: 0 }}><Icon name="brain" size={12} /> Trivia</span>
              <strong style={{ flex: 1 }}>{t.title}</strong>
              <button className="btn ghost sm" onClick={() => remove('trivias', t.id)}><Icon name="trash" size={14} /></button>
            </div>
            <label>Titulo</label>
            <input value={t.title} onChange={(e) => update('trivias', t.id, { title: e.target.value })} />
            <label>Descripcion</label>
            <textarea value={t.description} onChange={(e) => update('trivias', t.id, { description: e.target.value })} />
            <label>Link al Form</label>
            <input value={t.url} onChange={(e) => update('trivias', t.id, { url: e.target.value })} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Abre</label>
                <input type="date" value={t.opensAt} onChange={(e) => update('trivias', t.id, { opensAt: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Cierra</label>
                <input type="date" value={t.closesAt} onChange={(e) => update('trivias', t.id, { closesAt: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------- People (birthdays + amaversaries) --------------------------- */
function PeopleAdmin() {
  const { birthdays, amaversaries, add, update, remove } = useStore()
  const [bRef] = useAutoAnimate()
  const [aRef] = useAutoAnimate()
  const [b, setB] = useState({ login: '', manager: '', day: 1, month: 'July' })
  const [a, setA] = useState({ login: '', manager: '', day: 1, month: 'July', years: 1 })

  return (
    <div>
      <div className="notice" style={{ marginBottom: 16, fontSize: 13 }}>
        Cumpleanos y amaversarios. En produccion se cargan desde la base de datos (import de los CSV
        de SEPO); aqui puedes agregarlos o corregirlos manualmente.
      </div>

      <div className="grid cols-2">
        {/* Birthdays */}
        <div>
          <div className="section-title"><Icon name="cake" size={14} /><span>Cumpleanos</span></div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px' }}><label>Login</label><input value={b.login} onChange={(e) => setB({ ...b, login: e.target.value })} /></div>
              <div style={{ flex: '1 1 120px' }}><label>Manager</label><input value={b.manager} onChange={(e) => setB({ ...b, manager: e.target.value })} /></div>
              <div style={{ flex: '0 0 70px' }}><label>Dia</label><input type="number" min="1" max="31" value={b.day} onChange={(e) => setB({ ...b, day: +e.target.value })} /></div>
              <div style={{ flex: '1 1 110px' }}><label>Mes</label><input value={b.month} onChange={(e) => setB({ ...b, month: e.target.value })} /></div>
            </div>
            <button className="btn sm" style={{ marginTop: 10 }} onClick={() => { if (b.login) { add('birthdays', { ...b }); setB({ login: '', manager: '', day: 1, month: 'July' }) } }}><Icon name="plus" size={14} /> Agregar</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }} ref={bRef}>
            <table>
              <thead><tr><th>Login</th><th>Dia</th><th>Mes</th><th></th></tr></thead>
              <tbody>
                {birthdays.map((x) => (
                  <tr key={x.id || x.login}>
                    <td>{x.login}</td><td>{x.day}</td><td>{x.month}</td>
                    <td><button className="btn ghost sm" onClick={() => remove('birthdays', x.id)}><Icon name="trash" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Amaversaries */}
        <div>
          <div className="section-title"><Icon name="trophy" size={14} /><span>Amaversarios</span></div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px' }}><label>Login</label><input value={a.login} onChange={(e) => setA({ ...a, login: e.target.value })} /></div>
              <div style={{ flex: '1 1 120px' }}><label>Manager</label><input value={a.manager} onChange={(e) => setA({ ...a, manager: e.target.value })} /></div>
              <div style={{ flex: '0 0 70px' }}><label>Dia</label><input type="number" min="1" max="31" value={a.day} onChange={(e) => setA({ ...a, day: +e.target.value })} /></div>
              <div style={{ flex: '1 1 100px' }}><label>Mes</label><input value={a.month} onChange={(e) => setA({ ...a, month: e.target.value })} /></div>
              <div style={{ flex: '0 0 70px' }}><label>Anos</label><input type="number" min="1" value={a.years} onChange={(e) => setA({ ...a, years: +e.target.value })} /></div>
            </div>
            <button className="btn sm" style={{ marginTop: 10 }} onClick={() => { if (a.login) { add('amaversaries', { ...a }); setA({ login: '', manager: '', day: 1, month: 'July', years: 1 }) } }}><Icon name="plus" size={14} /> Agregar</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }} ref={aRef}>
            <table>
              <thead><tr><th>Login</th><th>Dia</th><th>Anos</th><th></th></tr></thead>
              <tbody>
                {amaversaries.map((x) => (
                  <tr key={x.id || x.login}>
                    <td>{x.login}</td><td>{x.day}</td><td>{x.years}</td>
                    <td><button className="btn ghost sm" onClick={() => remove('amaversaries', x.id)}><Icon name="trash" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --------------------------- Roles --------------------------- */
function RolesAdmin() {
  const [roles, setRoles] = useState(() => Object.entries(ROLE_ALLOWLIST).map(([login, role]) => ({ login, role })))
  const [login, setLogin] = useState('')
  const [role, setRole] = useState('manager')

  return (
    <div>
      <div className="notice" style={{ marginBottom: 16 }}>
        Todos entran como Colaborador por defecto (via Midway). Aqui solo asignas managers,
        managers SEPO y admins. Esto sera la tabla vibe-roles en DynamoDB.
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label>Login</label>
            <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="ej. jperez" />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {Object.entries(ROLES).filter(([k]) => k !== 'collaborator').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button className="btn" onClick={() => {
            if (!login) return
            setRoles([...roles.filter((r) => r.login !== login), { login, role }])
            setLogin('')
          }}>Asignar</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead><tr><th>Login</th><th>Rol</th><th></th></tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.login}>
                <td>{r.login}</td>
                <td><span className={`role-badge ${r.role}`}>{ROLES[r.role].label}</span></td>
                <td><button className="btn ghost sm" onClick={() => setRoles(roles.filter((x) => x.login !== r.login))}>Quitar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
