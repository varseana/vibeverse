import { Link } from 'react-router-dom'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useStore } from '../lib/store.jsx'
import { useAuth } from '../lib/auth.jsx'
import { fmtDate, fmtShort } from '../lib/format.js'
import { eventState, deadlineState } from '../lib/eventState.js'
import FlyerCarousel from '../components/FlyerCarousel.jsx'
import EventBanner from '../components/EventBanner.jsx'
import Icon from '../components/Icon.jsx'

function SectionTitle({ icon, children }) {
  return (
    <div className="section-title">
      <Icon name={icon} size={15} />
      <span>{children}</span>
    </div>
  )
}

export default function Home() {
  const { isManager } = useAuth()
  const { news, links, events, trivias } = useStore()
  const [newsRef] = useAutoAnimate()
  const [linksRef] = useAutoAnimate()
  const pinned = news.find((n) => n.pinned) || news[0]
  const rest = news.filter((n) => !pinned || n.id !== pinned.id)
  const live = events.filter((e) => eventState(e) === 'live')
  // Deadlines approaching in the next few days, to surface on Home.
  const closingSoon = events
    .map((e) => ({ e, dl: deadlineState(e) }))
    .filter((x) => x.dl && x.dl.state !== 'closed')
    .sort((a, b) => a.dl.days - b.dl.days)
    .slice(0, 3)
  const shownLinks = links.filter((l) => !l.managerOnly || isManager)

  return (
    <div>
      {/* Flyer carousel with the home-featured image centered */}
      <FlyerCarousel />

      {/* Latest pinned news */}
      {pinned && (
        <div className="hero">
          <span className="tag">{pinned.tag}</span>
          <h1><span>{pinned.title}</span></h1>
          <p>{pinned.body}</p>
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>{fmtDate(pinned.date)}</p>
        </div>
      )}

      {/* Live now */}
      {live.length > 0 && (
        <>
          <SectionTitle icon="live">En vivo ahora</SectionTitle>
          <div className="grid cols-2">
            {live.map((e) => <EventBanner key={e.id} ev={e} />)}
          </div>
        </>
      )}

      {/* Deadlines approaching */}
      {closingSoon.length > 0 && (
        <>
          <SectionTitle icon="clock">Cierran pronto</SectionTitle>
          <div className="grid cols-3">
            {closingSoon.map(({ e, dl }) => (
              <Link key={e.id} className="card hover" to="/calendar">
                <span className="tag"><Icon name="calendar" size={12} /> {e.type}</span>
                <h3>{e.title}</h3>
                <div className={`deadline-chip ${dl.state}`}>
                  <Icon name="clock" size={13} />
                  {e.deadlineLabel || 'Deadline'}: {dl.text}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Active trivias */}
      <SectionTitle icon="brain">Trivias activas</SectionTitle>
      <div className="grid cols-3">
        {trivias.map((t) => (
          <a key={t.id} className="card hover" href={t.url} target="_blank" rel="noreferrer">
            <span className="tag"><Icon name="brain" size={12} /> Trivia</span>
            <h3>{t.title}</h3>
            <p>{t.description}</p>
            <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
              Cierra el {fmtShort(t.closesAt)}, abrir en Forms
            </p>
          </a>
        ))}
      </div>

      {/* Quick links */}
      <SectionTitle icon="sparkles">Accesos rapidos</SectionTitle>
      <div className="grid cols-4" ref={linksRef}>
        {shownLinks.map((l) => {
          const internal = l.url.startsWith('#')
          const inner = (
            <>
              <div className="ql-icon"><Icon name={l.icon} size={22} /></div>
              <h3 style={{ fontSize: 15 }}>{l.label}</h3>
              <p className="muted" style={{ fontSize: 12 }}>{l.category}</p>
            </>
          )
          return internal ? (
            <Link key={l.id} className="card hover ql-card" to={l.url.slice(1)}>{inner}</Link>
          ) : (
            <a key={l.id} className="card hover ql-card" href={l.url} target="_blank" rel="noreferrer">{inner}</a>
          )
        })}
      </div>

      {/* More news */}
      {rest.length > 0 && (
        <>
          <SectionTitle icon="news">Mas noticias</SectionTitle>
          <div className="grid cols-2" ref={newsRef}>
            {rest.map((n) => (
              <div key={n.id} className="card">
                <span className="tag">{n.tag}</span>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
                <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>{fmtDate(n.date)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* AI is your ally now lives in its own tab (/ai-ally). Surface a link. */}
      <SectionTitle icon="idea">AI is your ally</SectionTitle>
      <Link to="/ai-ally" className="card hover" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="ql-icon" style={{ margin: 0 }}><Icon name="idea" size={22} /></span>
        <span style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 2 }}>Revista AI is your ally</h3>
          <p className="muted" style={{ fontSize: 13 }}>Ideas de IA de SEPO en formato revista. Abrir para leer.</p>
        </span>
        <Icon name="next" size={20} />
      </Link>
    </div>
  )
}
