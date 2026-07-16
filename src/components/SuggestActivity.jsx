import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { useAuth } from '../lib/auth.jsx'
import Icon from './Icon.jsx'

// CTA + form so anyone can report an activity they know exists but don't see on
// the calendar. Saved to the store (maps to a DynamoDB table later); VIBE reviews
// the reports in the Admin panel.
export default function SuggestActivity() {
  const { add } = useStore()
  const { login } = useAuth()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', note: '' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.title.trim()) return
    add('suggestions', {
      title: form.title.trim(),
      date: form.date,
      note: form.note.trim(),
      by: login,
      status: 'nueva',
      // createdAt is set on the backend later; kept out here to avoid Date.now churn.
    })
    setSent(true)
    setForm({ title: '', date: '', note: '' })
  }

  return (
    <div className="suggest-cta">
      {!open && !sent && (
        <div className="suggest-banner">
          <div>
            <strong>No ves una actividad que sabes que existe?</strong>
            <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>Cuentanos y el equipo VIBE la agrega al calendario.</p>
          </div>
          <button className="btn" onClick={() => setOpen(true)}>
            <Icon name="idea" size={16} /> Haznoslo saber
          </button>
        </div>
      )}

      {open && !sent && (
        <div className="card" style={{ marginTop: 4 }}>
          <h3>Reportar una actividad</h3>
          <label>Nombre de la actividad</label>
          <input value={form.title} maxLength={50} onChange={(e) => set('title', e.target.value)} placeholder="ej. Celebracion del Dia del Nino" />
          <div className="char-count" style={{ color: form.title.length >= 50 ? 'var(--warn)' : 'var(--muted)' }}>
            {form.title.length}/50
          </div>
          <label>Fecha aproximada (opcional)</label>
          <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          <label>Detalles (opcional)</label>
          <textarea value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Todo lo que sepas: quien la organiza, donde la viste, etc." />
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn" disabled={!form.title.trim()} onClick={submit}>
              <Icon name="plus" size={16} /> Enviar
            </button>
          </div>
        </div>
      )}

      {sent && (
        <div className="suggest-thanks">
          <Icon name="sparkles" size={18} />
          <div>
            <strong>Gracias!</strong>
            <p className="muted" style={{ fontSize: 13 }}>El equipo VIBE revisara tu reporte.</p>
          </div>
          <button className="btn ghost sm" onClick={() => setSent(false)}>Reportar otra</button>
        </div>
      )}
    </div>
  )
}
