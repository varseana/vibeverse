import { createContext, useContext, useState, useEffect } from 'react'
import { FLYERS, NEWS, QUICK_LINKS, EVENTS, AWARDS, AI_EDITIONS, TRIVIAS, BIRTHDAYS, AMAVERSARIES } from '../data/seed.js'

// ---------------------------------------------------------------------------
// Content store
// ---------------------------------------------------------------------------
// Holds the editable content (flyers, news, quick links, events) in one place
// so the admin panel and the public pages stay in sync. Persists to
// localStorage so edits survive a reload. In production this is replaced by
// the API layer (each setter becomes a POST/PUT/DELETE to the backend).
// ---------------------------------------------------------------------------

const KEY = 'vibeverse_content_v8'

const DEFAULTS = {
  flyers: FLYERS,
  news: NEWS,
  links: QUICK_LINKS,
  events: EVENTS,
  awards: AWARDS,
  aiEditions: AI_EDITIONS,
  trivias: TRIVIAS,
  birthdays: BIRTHDAYS,
  amaversaries: AMAVERSARIES,
  // Activity suggestions reported by users ("I know of an activity you're missing").
  suggestions: [],
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULTS
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [content, setContent] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(content)) } catch { /* ignore */ }
  }, [content])

  // Generic collection helpers keyed by section name.
  const add = (section, item) =>
    setContent((c) => ({ ...c, [section]: [...c[section], { ...item, id: section + '_' + Date.now() }] }))

  const update = (section, id, patch) =>
    setContent((c) => ({ ...c, [section]: c[section].map((x) => (x.id === id ? { ...x, ...patch } : x)) }))

  const remove = (section, id) =>
    setContent((c) => ({ ...c, [section]: c[section].filter((x) => x.id !== id) }))

  // Flyer-specific: only one flyer can be the "home" featured image.
  const setHomeFlyer = (id) =>
    setContent((c) => ({ ...c, flyers: c.flyers.map((f) => ({ ...f, isHome: f.id === id })) }))

  // Award-specific: stable slug id so nominations never break; new awards start
  // active and appended to the end of their cadence.
  const addAward = (award) => {
    const slug = 'awd_' + (award.name || 'award').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now().toString(36)
    setContent((c) => ({
      ...c,
      awards: [...c.awards, { icon: 'award', active: true, order: c.awards.length + 1, ...award, id: slug }],
    }))
  }

  // Soft-delete: flip active instead of removing, so past nominations resolve.
  const toggleAwardActive = (id) =>
    setContent((c) => ({ ...c, awards: c.awards.map((a) => (a.id === id ? { ...a, active: !a.active } : a)) }))

  // AI magazine: exactly one edition is the "current" one shown first on Home.
  const setCurrentEdition = (id) =>
    setContent((c) => ({ ...c, aiEditions: c.aiEditions.map((e) => ({ ...e, current: e.id === id })) }))

  const reset = () => setContent(DEFAULTS)

  const value = { ...content, add, update, remove, setHomeFlyer, addAward, toggleAwardActive, setCurrentEdition, reset }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
