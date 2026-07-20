import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { fmtDate } from '../lib/format.js'
import Icon from '../components/Icon.jsx'
import { AdminEditBar, AdminEditButton } from '../components/AdminEdit.jsx'

// fecha demo (misma que eventState.js usa)
const NOW = new Date('2026-07-15T12:00:00')

function isLive(t) {
  const open = new Date(t.opensAt + 'T00:00:00')
  const close = new Date(t.closesAt + 'T23:59:59')
  return NOW >= open && NOW <= close
}

export default function Trivias() {
  const { trivias } = useStore()
  const [tab, setTab] = useState('live')

  const live = trivias.filter((t) => isLive(t))
  const past = trivias.filter((t) => !isLive(t))
  const shown = tab === 'live' ? live : past

  return (
    <div>
      <div className="page-head">
        <h1>Trivias</h1>
        <p>Participa en las trivias de VIBE. Se abren en Microsoft Forms.</p>
      </div>

      <AdminEditBar tab="Trivias" label="trivias" />

      {/* toggle live / past */}
      <div className="subtabs" style={{ marginBottom: 20 }}>
        <button className={tab === 'live' ? 'active' : ''} onClick={() => setTab('live')}>
          <Icon name="live" size={14} /> Activas ({live.length})
        </button>
        <button className={tab === 'past' ? 'active' : ''} onClick={() => setTab('past')}>
          <Icon name="clock" size={14} /> Pasadas ({past.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          {tab === 'live'
            ? 'No hay trivias activas por ahora. Vuelve pronto.'
            : 'No hay trivias pasadas todavia.'}
        </div>
      ) : (
        <div className="grid cols-2">
          {shown.map((t) => {
            const ended = !isLive(t)
            return (
              <div key={t.id} className={`card hover trivia-card ${ended ? 'trivia-ended' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
                <AdminEditButton tab="Trivias" id={t.id} title="Editar esta trivia (VIBE)" />
                {/* imagen de fondo a la derecha con fade */}
                {t.image && (
                  <img className="trivia-bg" src={t.image} alt="" style={{ objectPosition: t.imagePos || '50% 50%' }} />
                )}
                <div className="trivia-content">
                  <span className="tag">
                    <Icon name="brain" size={12} />
                    {ended ? ' Finalizada' : ' Trivia'}
                  </span>
                  <h3>{t.title}</h3>
                  <p>{t.description}</p>
                  <p className="muted" style={{ margin: '10px 0', fontSize: 13 }}>
                    {fmtDate(t.opensAt)} al {fmtDate(t.closesAt)}
                  </p>
                  {!ended && (
                    <a className="btn" href={t.url} target="_blank" rel="noreferrer">
                      Participar <Icon name="external" size={15} />
                    </a>
                  )}
                  {ended && (
                    <span className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>Esta trivia ya cerro.</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
