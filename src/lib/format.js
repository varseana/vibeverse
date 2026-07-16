// Small formatting helpers.

export function fmtDate(iso) {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''))
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function fmtShort(iso) {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''))
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })
}

// Countdown string for reward deadlines. Uses a `now` you pass in so it can
// tick every second from the caller.
export function countdown(dueAtIso, now) {
  const due = new Date(dueAtIso).getTime()
  const diff = due - now
  if (diff <= 0) {
    const ago = Math.floor(-diff / 86400000)
    return { closed: true, text: ago > 0 ? `Cerró hace ${ago}d` : 'Cerrado' }
  }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { closed: false, text: `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s` }
}
