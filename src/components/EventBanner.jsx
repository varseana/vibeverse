import { fmtDate } from '../lib/format.js'
import { eventState, deadlineState } from '../lib/eventState.js'
import Icon from './Icon.jsx'

// Horizontal banner for Home: text on the LEFT, the event image on the RIGHT.
// The image fades (gradient mask) into the card so it blends toward the text.
// If there is no image, it falls back to a plain text banner. Sizing is driven
// by the card height, and the image column scales with it.
export default function EventBanner({ ev }) {
  const state = eventState(ev)
  const dl = deadlineState(ev)
  const hasImg = !!ev.image

  return (
    <div className={`event-banner ${hasImg ? 'has-img' : ''}`}>
      <div className="event-banner-text">
        {state === 'live'
          ? <span className="tag live"><Icon name="live" size={12} /> EN VIVO</span>
          : <span className="tag"><Icon name="calendar" size={12} /> {ev.type}</span>}
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
      {hasImg && (
        <div className="event-banner-img">
          <img src={ev.image} alt="" />
        </div>
      )}
    </div>
  )
}
