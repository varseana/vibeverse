// ---------------------------------------------------------------------------
// Event / activity state derivation
// ---------------------------------------------------------------------------
// Live / upcoming / ended and deadline-open / closing / closed are computed
// from the event's dates against "now" so they are always accurate (no stale
// manual flags). Demo clock is fixed so seed data lines up.
// ---------------------------------------------------------------------------

// Fixed "today" for the demo. In production this becomes `new Date()`.
export const NOW = new Date('2026-07-15T12:00:00')

const DAY = 86400000

// Parse a YYYY-MM-DD as local noon (avoids timezone off-by-one).
function parseDay(d) {
  return d ? new Date(d + 'T12:00:00') : null
}

// Returns 'live' | 'upcoming' | 'ended' for an event, based on date/endDate.
export function eventState(ev, now = NOW) {
  const start = parseDay(ev.date)
  const end = parseDay(ev.endDate) || start
  if (!start) return 'upcoming'
  const startMs = start.getTime()
  const endMs = end.getTime() + DAY - 1 // include the whole end day
  const t = now.getTime()
  if (t < startMs) return 'upcoming'
  if (t > endMs) return 'ended'
  return 'live'
}

export const isLive = (ev, now = NOW) => eventState(ev, now) === 'live'

// Whole calendar-day difference between two dates (b - a), ignoring time.
function dayDiff(a, b) {
  const am = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const bm = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((bm.getTime() - am.getTime()) / DAY)
}

// Deadline status: null if no deadline, else { state, days, text }.
// state: 'open' | 'soon' (<=3 days) | 'closed'. `days` = calendar days until due.
export function deadlineState(ev, now = NOW) {
  if (!ev.deadline) return null
  const due = parseDay(ev.deadline)
  const diffDays = dayDiff(now, due) // positive = future, 0 = today, negative = past
  if (diffDays < 0) return { state: 'closed', days: diffDays, text: `Cerrado hace ${Math.abs(diffDays)}d` }
  if (diffDays === 0) return { state: 'soon', days: 0, text: 'Cierra hoy' }
  if (diffDays <= 3) return { state: 'soon', days: diffDays, text: `Cierra en ${diffDays}d` }
  return { state: 'open', days: diffDays, text: `Cierra en ${diffDays}d` }
}

// Sort helper: soonest start first.
export function byDate(a, b) {
  return (a.date || '').localeCompare(b.date || '')
}
