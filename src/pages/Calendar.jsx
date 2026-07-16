import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { eventState, byDate, NOW } from '../lib/eventState.js'
import Icon from '../components/Icon.jsx'
import EventCard from '../components/EventCard.jsx'
import SuggestActivity from '../components/SuggestActivity.jsx'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const TODAY = NOW

export default function Calendar() {
  const { events } = useStore()
  const [view, setView] = useState({ y: 2026, m: 6 }) // m is 0-indexed (6 = July)

  const first = new Date(view.y, view.m, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()

  // Place both the event's own days (date..endDate) and its deadline on the grid.
  const byDay = {}
  const put = (day, item) => { (byDay[day] = byDay[day] || []).push(item) }
  for (const e of events) {
    const start = new Date(e.date + 'T12:00:00')
    const end = e.endDate ? new Date(e.endDate + 'T12:00:00') : start
    // Every day the event spans, if within the viewed month.
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === view.y && d.getMonth() === view.m) {
        put(d.getDate(), { ev: e, kind: 'event' })
      }
    }
    // Deadline marker.
    if (e.deadline) {
      const dl = new Date(e.deadline + 'T12:00:00')
      if (dl.getFullYear() === view.y && dl.getMonth() === view.m) {
        put(dl.getDate(), { ev: e, kind: 'deadline' })
      }
    }
  }

  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const move = (delta) => {
    let m = view.m + delta, y = view.y
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setView({ y, m })
  }

  const isToday = (d) =>
    d === TODAY.getDate() && view.m === TODAY.getMonth() && view.y === TODAY.getFullYear()

  // Upcoming = live or upcoming (not ended), soonest first.
  const upcoming = events
    .filter((e) => eventState(e) !== 'ended')
    .sort(byDate)

  return (
    <div>
      <div className="page-head">
        <h1>Calendario VIBE</h1>
        <p>Todos los eventos, trivias y actividades de SEPO en un solo lugar.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn ghost sm" onClick={() => move(-1)}><Icon name="prev" size={18} /></button>
        <h2 style={{ minWidth: 200, textAlign: 'center' }}>{MONTHS[view.m]} {view.y}</h2>
        <button className="btn ghost sm" onClick={() => move(1)}><Icon name="next" size={18} /></button>
        <button className="btn ghost sm" onClick={() => setView({ y: 2026, m: 6 })}>Hoy</button>
      </div>

      <div className="cal-legend">
        <span><i className="dot ev" /> Evento</span>
        <span><i className="dot live" /> En vivo</span>
        <span><i className="dot dl" /> Deadline</span>
      </div>

      <div className="cal-grid">
        {DAYS.map((d) => <div key={d} className="cal-head">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={`cal-cell ${d && isToday(d) ? 'today' : ''}`} style={{ visibility: d ? 'visible' : 'hidden' }}>
            {d && <div className="cal-day">{d}</div>}
            {d && (byDay[d] || []).map((item, idx) => {
              if (item.kind === 'deadline') {
                return (
                  <div key={idx} className="cal-ev dl" title={`${item.ev.deadlineLabel || 'Deadline'}: ${item.ev.title}`}>
                    {item.ev.deadlineLabel || 'Deadline'}
                  </div>
                )
              }
              const live = eventState(item.ev) === 'live'
              return (
                <div key={idx} className={`cal-ev ${live ? 'live' : ''}`} title={item.ev.title}>
                  {item.ev.image && (
                    <img src={item.ev.image} alt="" className="cal-ev-thumb" />
                  )}
                  <span className="cal-ev-title">{item.ev.title}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="section-title"><Icon name="calendar" size={15} /><span>Proximos eventos</span></div>
      <div className="grid cols-2">
        {upcoming.length === 0 ? (
          <div className="empty">No hay eventos proximos.</div>
        ) : upcoming.map((e) => <EventCard key={e.id} ev={e} />)}
      </div>

      <SuggestActivity />
    </div>
  )
}
