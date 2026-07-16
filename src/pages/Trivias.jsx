import { useStore } from '../lib/store.jsx'
import { fmtDate } from '../lib/format.js'
import Icon from '../components/Icon.jsx'

export default function Trivias() {
  const { trivias } = useStore()
  return (
    <div>
      <div className="page-head">
        <h1>Trivias activas</h1>
        <p>Participa en las trivias de VIBE. Se abren en Microsoft Forms.</p>
      </div>

      {trivias.length === 0 ? (
        <div className="empty">No hay trivias activas por ahora. Vuelve pronto.</div>
      ) : (
        <div className="grid cols-2">
          {trivias.map((t) => (
            <div key={t.id} className="card hover">
              <span className="tag"><Icon name="brain" size={12} /> Trivia</span>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
              <p className="muted" style={{ margin: '10px 0', fontSize: 13 }}>
                {fmtDate(t.opensAt)} al {fmtDate(t.closesAt)}
              </p>
              <a className="btn" href={t.url} target="_blank" rel="noreferrer">Participar <Icon name="external" size={15} /></a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
