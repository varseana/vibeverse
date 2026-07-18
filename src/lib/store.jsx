import { createContext, useContext, useState, useEffect } from 'react'
import { FLYERS, NEWS, QUICK_LINKS, EVENTS, AWARDS, AI_EDITIONS, TRIVIAS, BIRTHDAYS, AMAVERSARIES, DIGESTS } from '../data/seed.js'

// ---------------------------------------------------------------------------
// Content store
// ---------------------------------------------------------------------------
// Holds the editable content (flyers, news, quick links, events) in one place
// so the admin panel and the public pages stay in sync. Persists to
// localStorage so edits survive a reload. In production this is replaced by
// the API layer (each setter becomes a POST/PUT/DELETE to the backend).
// ---------------------------------------------------------------------------

const KEY = 'vibeverse_content_v10'

// Which Home sections are visible. Toggled from Admin > Inicio. If a section is
// off it simply does not render on Home (the content still exists elsewhere,
// e.g. Trivias/Calendar tabs). Keys map 1:1 to the blocks in pages/Home.jsx.
export const HOME_SECTIONS = [
  { key: 'flyers', label: 'Carrusel de flyers' },
  { key: 'news', label: 'Noticias (destacada y mas noticias)' },
  { key: 'live', label: 'En vivo ahora' },
  { key: 'deadlines', label: 'Cierran pronto' },
  { key: 'trivias', label: 'Trivias activas' },
  { key: 'links', label: 'Accesos rapidos' },
  { key: 'aiAlly', label: 'AI is your ally' },
]

const DEFAULT_HOME_SECTIONS = Object.fromEntries(HOME_SECTIONS.map((s) => [s.key, true]))

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
  digests: DIGESTS,
  // Activity suggestions reported by users ("I know of an activity you're missing").
  suggestions: [],
  // Home section visibility (all on by default).
  homeSections: DEFAULT_HOME_SECTIONS,
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      return {
        ...DEFAULTS,
        ...saved,
        // Deep-merge home sections so newly added section keys default to on.
        homeSections: { ...DEFAULT_HOME_SECTIONS, ...(saved.homeSections || {}) },
      }
    }
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

  // Home section visibility: flip one section on/off.
  const toggleHomeSection = (key) =>
    setContent((c) => ({ ...c, homeSections: { ...c.homeSections, [key]: !c.homeSections[key] } }))

  // Digest helpers
  const addDigest = (digest) => {
    const id = 'digest_' + Date.now().toString(36)
    setContent((c) => ({ ...c, digests: [...c.digests, { ...digest, id, status: 'draft', publishedAt: null, sections: digest.sections || [] }] }))
    return id
  }
  const updateDigest = (id, patch) =>
    setContent((c) => ({ ...c, digests: c.digests.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
  const removeDigest = (id) =>
    setContent((c) => ({ ...c, digests: c.digests.filter((d) => d.id !== id) }))
  const publishDigest = (id) =>
    setContent((c) => ({ ...c, digests: c.digests.map((d) => (d.id === id ? { ...d, status: 'published', publishedAt: new Date().toISOString().slice(0, 10) } : d)) }))
  const unpublishDigest = (id) =>
    setContent((c) => ({ ...c, digests: c.digests.map((d) => (d.id === id ? { ...d, status: 'draft', publishedAt: null } : d)) }))
  // Update sections array for a specific digest
  const setDigestSections = (id, sections) =>
    setContent((c) => ({ ...c, digests: c.digests.map((d) => (d.id === id ? { ...d, sections } : d)) }))

  const value = { ...content, add, update, remove, setHomeFlyer, addAward, toggleAwardActive, setCurrentEdition, toggleHomeSection, addDigest, updateDigest, removeDigest, publishDigest, unpublishDigest, setDigestSections }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
