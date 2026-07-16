import { fmtDate } from '../lib/format.js'
import { eventState, deadlineState } from '../lib/eventState.js'
import Icon from './Icon.jsx'

// Event card that optionally shows the admin-uploaded image as a background,
// either blurred or solid, at the chosen opacity. Text sits above a scrim so it
// stays readable. Used by Calendar, Home and Monthly Digest for consistency.
// The `owner` is internal VIBE info: never shown here (public views). Only the
// admin panel exposes owners.
export default function EventCard({ ev, showDeadline = true }) {
  const state = eventState(ev)
  const dl = showDeadline ? deadlineState(ev) : null
  const hasBg = !!ev.image
  const opacity = ev.imageOpacity ?? 0.5
  const blur = (ev.imageMode || 'blur') === 'blur'

  return (
    <div className={`card ${hasBg ? 'has-bg' : ''}`}>
      {hasBg && (
        <div
          className="card-bg"
          style={{
            backgroundImage: `url(${ev.image})`,
            opacity,
            filter: blur ? 'blur(6px)' : 'none',
            transform: blur ? 'scale(1.08)' : 'none', // hide blurred edges
          }}
        />
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        {state === 'live' && <span className="tag live"><Icon name="live" size={12} /> EN VIVO</span>}
        <span className="tag" style={{ margin: 0 }}>{ev.type}</span>
      </div>
      <h3>{ev.title}</h3>
      <p className="muted" style={{ fontSize: 13 }}>
        {fmtDate(ev.date)}{ev.endDate && ev.endDate !== ev.date ? ` al ${fmtDate(ev.endDate)}` : ''}
      </p>
      {dl && (
        <div className={`deadline-chip ${dl.state}`}>
          <Icon name="clock" size={13} /> {ev.deadlineLabel || 'Deadline'}: {dl.text}
        </div>
      )}
    </div>
  )
}
