import { Link } from 'react-router-dom'
import { useStore } from '../lib/store.jsx'
import { fmtDate } from '../lib/format.js'
import { eventState, byDate } from '../lib/eventState.js'
import Icon from '../components/Icon.jsx'
import EventCard from '../components/EventCard.jsx'

function SectionTitle({ icon, children }) {
  return (
    <div className="section-title">
      <Icon name={icon} size={15} />
      <span>{children}</span>
    </div>
  )
}

// Monthly Digest: a rollup of everything VIBE published, more detailed than
// Home. Reads from the same store so it always reflects the latest content.
export default function MonthlyDigest() {
  const { news, events, links, trivias } = useStore()

  const upcoming = events.filter((e) => eventState(e) !== 'ended').sort(byDate)
  const past = events.filter((e) => eventState(e) === 'ended').sort(byDate).reverse()

  return (
    <div>
      <div className="page-head">
        <h1>Monthly Digest</h1>
        <p>El resumen del mes en VIBE: noticias, eventos, trivias y mas, todo en un solo lugar.</p>
      </div>

      {/* Highlights: newest news pieces */}
      <SectionTitle icon="news">Lo mas reciente</SectionTitle>
      {news.length === 0 ? (
        <div className="empty">No hay noticias este mes.</div>
      ) : (
        <div className="grid cols-2">
          {news.map((n) => (
            <div key={n.id} className="card">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <span className="tag" style={{ margin: 0 }}>{n.tag}</span>
                {n.pinned && <span className="home-badge">DESTACADA</span>}
              </div>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>{fmtDate(n.date)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming events with deadlines */}
      <SectionTitle icon="calendar">Proximos eventos</SectionTitle>
      {upcoming.length === 0 ? (
        <div className="empty">No hay eventos proximos.</div>
      ) : (
        <div className="grid cols-3">
          {upcoming.map((e) => <EventCard key={e.id} ev={e} />)}
        </div>
      )}

      {/* Active trivias */}
      <SectionTitle icon="brain">Trivias activas</SectionTitle>
      <div className="grid cols-3">
        {trivias.map((t) => (
          <a key={t.id} className="card hover" href={t.url} target="_blank" rel="noreferrer">
            <span className="tag"><Icon name="brain" size={12} /> Trivia</span>
            <h3>{t.title}</h3>
            <p>{t.description}</p>
          </a>
        ))}
      </div>

      {/* What already happened this month */}
      {past.length > 0 && (
        <>
          <SectionTitle icon="trophy">Ya sucedio</SectionTitle>
          <div className="grid cols-3">
            {past.map((e) => <EventCard key={e.id} ev={e} showDeadline={false} />)}
          </div>
        </>
      )}

      {/* Quick links roundup */}
      <SectionTitle icon="sparkles">Enlaces utiles</SectionTitle>
      <div className="grid cols-4">
        {links.filter((l) => !l.managerOnly).map((l) => {
          const internal = l.url.startsWith('#')
          const inner = (
            <>
              <div className="ql-icon"><Icon name={l.icon} size={22} /></div>
              <h3 style={{ fontSize: 15 }}>{l.label}</h3>
            </>
          )
          return internal
            ? <Link key={l.id} className="card hover ql-card" to={l.url.slice(1)}>{inner}</Link>
            : <a key={l.id} className="card hover ql-card" href={l.url} target="_blank" rel="noreferrer">{inner}</a>
        })}
      </div>
    </div>
  )
}
