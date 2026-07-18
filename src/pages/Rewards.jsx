import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { REWARDS, REWARD_DEADLINES, CADENCES, CURRENT_PERIOD, periodOptions } from '../data/seed.js'
import { useStore } from '../lib/store.jsx'
import { useAuth } from '../lib/auth.jsx'
import { countdown } from '../lib/format.js'
import Icon from '../components/Icon.jsx'

// Format a gift-card amount (USD). Only shown to the R&R team.
const fmtAmount = (a) => (typeof a === 'number' ? `$${a}` : '')

// Rewards & Recognition lives INSIDE Manager Hub. Nominating managers see and
// submit their OWN nominations; only the small R&R team (isRewardsManager) sees
// every nomination, marks delivery, and sees award amounts.
export default function RewardsSection() {
  const { login, isRewardsManager, isAdmin } = useAuth()
  const { awards } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [now, setNow] = useState(() => new Date('2026-07-15T18:00:00').getTime())
  const [rewards, setRewards] = useState(REWARDS)
  const [showModal, setShowModal] = useState(false)
  const tab = params.get('rr') === 'guide' ? 'guide' : 'nominations'
  const setTab = (t) => setParams(t === 'guide' ? { rr: 'guide' } : {}, { replace: true })
  const [listRef] = useAutoAnimate()

  useEffect(() => {
    const t = setInterval(() => setNow((n) => n + 1000), 1000)
    return () => clearInterval(t)
  }, [])

  const activeAwards = awards.filter((a) => a.active)
  // Amount lookup by stable award id (for showing the value on nomination cards).
  const amountFor = (awardId) => awards.find((a) => a.id === awardId)?.amount
  // Nominating managers see their own submissions; the R&R team sees all (they
  // deliver them and own the budget).
  const visible = isRewardsManager ? rewards : rewards.filter((r) => r.nominatedBy === login)

  // The R&R team marks a nomination as delivered (this is delivery, not approval).
  const markDelivered = (id) =>
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, deliveryStatus: 'delivered', deliveredBy: login } : r)))

  return (
    <div>
      <div className="subtabs">
        <button className={tab === 'nominations' ? 'active' : ''} onClick={() => setTab('nominations')}>
          <Icon name="trophy" size={15} /> {isRewardsManager ? 'Nominaciones y entrega' : 'Mis nominaciones'}
        </button>
        <button className={tab === 'guide' ? 'active' : ''} onClick={() => setTab('guide')}>
          <Icon name="idea" size={15} /> Guia de premios
        </button>
      </div>

      {tab === 'guide' ? (
        <AwardGuide awards={awards} isAdmin={isAdmin} showAmounts={isRewardsManager} onManage={() => navigate('/admin?tab=Premios')} />
      ) : (
        <>
          {/* Deadlines are target dates, NOT blockers. Retroactive is allowed. */}
          <div className="section-title"><Icon name="clock" size={15} /><span>Deadlines objetivo por categoria</span></div>
          <div className="grid cols-4">
            {REWARD_DEADLINES.map((d) => {
              const c = countdown(d.dueAt, now)
              return (
                <div key={d.cadence} className="card">
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{d.cadence.toUpperCase()}</div>
                  <h3 style={{ fontSize: 15, margin: '4px 0' }}>{d.period}</h3>
                  <div className={c.closed ? 'badge-warn' : 'badge-good'} style={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                    {c.closed ? 'Cerro (aun se puede retroactivo)' : c.text}
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Objetivo, CR 17:00</div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '26px 0 12px' }}>
            <div className="section-title" style={{ margin: 0 }}>
              <Icon name="trophy" size={15} />
              <span>{isRewardsManager ? 'Todas las nominaciones' : 'Mis nominaciones'}</span>
            </div>
            <button className="btn" onClick={() => setShowModal(true)}><Icon name="plus" size={16} /> Nominar</button>
          </div>

          {visible.length === 0 ? (
            <div className="empty">Aun no hay nominaciones. Reconoce a alguien.</div>
          ) : (
            <div className="grid cols-2" ref={listRef}>
              {visible.map((r) => {
                const amount = amountFor(r.awardId)
                return (
                <div key={r.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span className="tag"><Icon name="award" size={12} /> {r.awardName}</span>
                    <span className={`pill ${r.deliveryStatus === 'delivered' ? 'badge-good' : 'badge-warn'}`}>
                      {r.deliveryStatus === 'delivered' ? 'Entregado' : 'Pendiente de entrega'}
                    </span>
                  </div>
                  <h3>{r.nominee}</h3>
                  <p className="muted" style={{ marginTop: 6, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {r.cadence}, {r.period}, por {r.nominatedBy}
                    {r.retroactive && <span className="pill retro"><Icon name="clock" size={11} /> Retroactivo</span>}
                  </p>
                  {/* Amount is R&R-team only (they own the budget). */}
                  {isRewardsManager && typeof amount === 'number' && (
                    <div className="reward-amount"><Icon name="trophy" size={13} /> {fmtAmount(amount)}</div>
                  )}
                  {/* Only the R&R team can mark delivery. Managers just see status. */}
                  {isRewardsManager && r.deliveryStatus !== 'delivered' && (
                    <button className="btn sm" style={{ marginTop: 12 }} onClick={() => markDelivered(r.id)}>
                      <Icon name="award" size={14} /> Marcar como entregado
                    </button>
                  )}
                  {r.deliveryStatus === 'delivered' && r.deliveredBy && (
                    <p className="muted" style={{ marginTop: 8, fontSize: 11 }}>Entregado por {r.deliveredBy}</p>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <NominateModal
          login={login}
          awards={activeAwards}
          showAmounts={isRewardsManager}
          onClose={() => setShowModal(false)}
          onSave={(r) => { setRewards((prev) => [{ ...r, id: 'rew_' + Date.now() }, ...prev]); setShowModal(false) }}
        />
      )}
    </div>
  )
}

// Knowledge guide: one clear card per award grouped by cadence.
function AwardGuide({ awards, isAdmin, showAmounts, onManage }) {
  const active = awards.filter((a) => a.active)
  return (
    <div>
      <div className="notice" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ flex: 1, minWidth: 220 }}>
          Esta guia explica cada premio: que es, por que se da y quien califica. Usala para elegir
          el reconocimiento correcto con base en las metricas del investigador.
        </span>
        {isAdmin && (
          <button className="btn sm" onClick={onManage}>
            <Icon name="settings" size={15} /> Editar premios
          </button>
        )}
      </div>

      {CADENCES.map((cad) => {
        const list = active.filter((a) => a.cadence === cad).sort((a, b) => (a.order || 0) - (b.order || 0))
        if (list.length === 0) return null
        return (
          <div key={cad}>
            <div className="section-title"><Icon name="award" size={15} /><span>{cad}</span></div>
            <div className="grid cols-2">
              {list.map((a) => (
                <div key={a.id} className="card guide-card">
                  <div className="guide-head">
                    <span className="guide-ico"><Icon name={a.icon} size={20} /></span>
                    <h3>{a.name}</h3>
                    {showAmounts && typeof a.amount === 'number' && (
                      <span className="reward-amount sm" style={{ marginLeft: 'auto' }}>${a.amount}</span>
                    )}
                  </div>
                  <p className="guide-desc">{a.description}</p>
                  <div className="guide-row"><span className="guide-k">Por que</span><span>{a.why}</span></div>
                  <div className="guide-row"><span className="guide-k">Quien</span><span>{a.eligibility}</span></div>
                  {a.example && <div className="guide-example"><span className="guide-k">Ejemplo</span><em>{a.example}</em></div>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NominateModal({ login, awards, showAmounts, onClose, onSave }) {
  const [cadence, setCadence] = useState('Monthly')
  const cadenceAwards = awards.filter((a) => a.cadence === cadence).sort((a, b) => (a.order || 0) - (b.order || 0))
  const [awardId, setAwardId] = useState(cadenceAwards[0]?.id || '')
  const [period, setPeriod] = useState(CURRENT_PERIOD.Monthly)
  const [nominee, setNominee] = useState('')

  const onCadence = (val) => {
    setCadence(val)
    const first = awards.filter((a) => a.cadence === val).sort((a, b) => (a.order || 0) - (b.order || 0))[0]
    setAwardId(first?.id || '')
    setPeriod(CURRENT_PERIOD[val])
  }

  const award = awards.find((a) => a.id === awardId)
  const periods = periodOptions(cadence)
  const isRetro = period !== CURRENT_PERIOD[cadence]

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <h2>Nueva nominacion</h2>

        <label>Cadencia</label>
        <select value={cadence} onChange={(e) => onCadence(e.target.value)}>
          {CADENCES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <label>Premio</label>
        <select value={awardId} onChange={(e) => setAwardId(e.target.value)}>
          {cadenceAwards.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        {award && (
          <div className="award-hint">
            <div className="award-hint-head">
              <Icon name={award.icon} size={16} /><strong>{award.name}</strong>
              {showAmounts && typeof award.amount === 'number' && (
                <span className="reward-amount sm" style={{ marginLeft: 'auto' }}>${award.amount}</span>
              )}
            </div>
            <p>{award.description}</p>
            <p className="muted"><strong>Por que:</strong> {award.why}</p>
            <p className="muted"><strong>Quien califica:</strong> {award.eligibility}</p>
          </div>
        )}

        {/* Period is selectable so managers can submit retroactive nominations. */}
        <label>Periodo</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          {periods.map((p) => (
            <option key={p} value={p}>{p}{p === CURRENT_PERIOD[cadence] ? ' (actual)' : ''}</option>
          ))}
        </select>
        {isRetro && (
          <div className="retro-note">
            <Icon name="clock" size={14} /> Nominacion retroactiva: premio de un periodo anterior. VIBE lo entregara igual.
          </div>
        )}

        <label>Nominado (login del investigador)</label>
        <input value={nominee} onChange={(e) => setNominee(e.target.value)} placeholder="ej. davisanc" />

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn"
            disabled={!nominee || !award}
            onClick={() => onSave({ awardId: award.id, awardName: award.name, cadence, period, retroactive: isRetro, nominee, nominatedBy: login, deliveryStatus: 'pending' })}
          >Enviar nominacion</button>
        </div>
      </div>
    </div>
  )
}
