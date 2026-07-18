import { useStore } from '../lib/store.jsx'
import { useAuth } from '../lib/auth.jsx'
import Icon from '../components/Icon.jsx'
import RewardsSection from './Rewards.jsx'

// Manager Hub: resources for managers, plus Rewards & Recognition as a section.
// R&R is visible to nominating managers (sepo_manager, who see only their own
// nominations) and to the small R&R team (isRewardsManager, who see everything,
// amounts and delivery). A plain VIBE admin who is neither does NOT see R&R.
export default function ManagerHub() {
  const { links } = useStore()
  const { role, isRewardsManager } = useAuth()
  const canSeeRewards = isRewardsManager || role === 'sepo_manager'
  const art = links.find((l) => l.managerOnly)

  const cards = [
    { icon: 'art', title: 'Solicitar Arte o Flyer', desc: 'Pide un flyer, PPT o pieza de arte al equipo VIBE via el SharePoint.', url: art?.url || '#', cta: 'Ir al SharePoint' },
    { icon: 'slack', title: 'Enviar una idea', desc: 'Comparte ideas de actividades o mejoras en el canal de Slack de VIBE.', url: 'https://amazon.enterprise.slack.com', cta: 'Abrir Slack' },
    { icon: 'ppt', title: 'Solicitar PPT', desc: 'Presentaciones para town halls o reuniones de equipo.', url: art?.url || '#', cta: 'Solicitar' },
  ]

  return (
    <div>
      <div className="page-head">
        <h1>Manager Hub</h1>
        <p>Recursos y solicitudes para managers de SEPO.</p>
      </div>

      <div className="notice" style={{ marginBottom: 20 }}>
        Las solicitudes de arte, flyers y PPT se gestionan en el SharePoint del equipo VIBE.
        El envio de ideas y aprobaciones se coordina por Slack.
      </div>

      <div className="grid cols-3">
        {cards.map((c, i) => (
          <a key={i} className="card hover ql-card" href={c.url} target="_blank" rel="noreferrer">
            <div className="ql-icon"><Icon name={c.icon} size={22} /></div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <div className="btn ghost sm" style={{ marginTop: 14 }}>{c.cta} <Icon name="external" size={14} /></div>
          </a>
        ))}
      </div>

      {/* Rewards & Recognition: nominating managers + the R&R team only. */}
      {canSeeRewards && (
        <div style={{ marginTop: 40 }}>
          <div className="section-title" style={{ fontSize: 15, textTransform: 'none', letterSpacing: 0 }}>
            <Icon name="award" size={18} />
            <span style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text)' }}>
              Rewards and Recognition
            </span>
          </div>
          <p className="muted" style={{ marginTop: -4, marginBottom: 16, fontSize: 14 }}>
            Reconoce a tus investigadores con base en sus metricas. El submission es final; VIBE entrega.
          </p>
          <RewardsSection />
        </div>
      )}
    </div>
  )
}
