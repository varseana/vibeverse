// ---------------------------------------------------------------------------
// VIBEverse seed / mock data
// ---------------------------------------------------------------------------
// This stands in for the future backend (DynamoDB via API Gateway + Lambda).
// Everything here is derived from the real VIBE planning CSVs so the UI feels
// authentic during the demo. When the backend lands, swap src/lib/api.js to
// fetch these same shapes over HTTP.
// ---------------------------------------------------------------------------

// Helper: build a self-contained SVG flyer as a data URL so images always
// render without any network calls. Admins can replace these with real
// uploads or URLs from the admin panel.
export function svgFlyer(title, c1, c2) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='960' height='420'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>
    </linearGradient></defs>
    <rect width='960' height='420' fill='url(#g)'/>
    <text x='48' y='230' font-family='Inter,Arial,sans-serif' font-size='52' font-weight='800' fill='#ffffff'>${title}</text>
    <text x='48' y='285' font-family='Inter,Arial,sans-serif' font-size='24' fill='rgba(255,255,255,0.85)'>VIBEverse</text>
  </svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// Portrait flyer (800x1131) placeholder for the "AI is your ally" magazine.
// Real pages are uploaded by the admin; these keep the demo self-contained.
export function svgPage(title, subtitle, c1, c2) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1131'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>
    </linearGradient></defs>
    <rect width='800' height='1131' fill='url(#g)'/>
    <rect x='40' y='40' width='720' height='1051' fill='none' stroke='rgba(255,255,255,0.25)' stroke-width='2'/>
    <text x='64' y='120' font-family='Rubik,Arial,sans-serif' font-size='26' letter-spacing='3' fill='rgba(255,255,255,0.7)'>AI IS YOUR ALLY</text>
    <text x='64' y='560' font-family='Rubik,Arial,sans-serif' font-size='58' font-weight='800' fill='#ffffff'>${title}</text>
    <text x='64' y='620' font-family='Inter,Arial,sans-serif' font-size='28' fill='rgba(255,255,255,0.88)'>${subtitle}</text>
    <text x='64' y='1080' font-family='Inter,Arial,sans-serif' font-size='20' fill='rgba(255,255,255,0.6)'>SEPO x VIBE</text>
  </svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// The VIBE committee ("vibe people") - from Schedules.tsv
export const VIBE_TEAM = [
  { name: 'Fiorella Jimenez', login: 'fiorejr' },
  { name: 'Francini Lobo', login: 'fccastl' },
  { name: 'Jay Aguero', login: 'jasaguer' },
  { name: 'Joselyn Soto', login: 'sotoarta' },
  { name: 'Mercedes Barquero', login: 'mercbarq' },
  { name: 'Sean Vargas', login: 'varseana' },
  { name: 'Sofia Rojas', login: 'krojasca' },
]

// Flyer carousel. `isHome` marks the featured image shown first / centered.
// Each flyer can carry a hyperlink. Fully editable from /admin.
export const FLYERS = [
  { id: 'fl_1', title: 'Bienvenido a VIBEverse', image: svgFlyer('Bienvenido a VIBEverse', '#9b30ff', '#6a5cff'), link: '', isHome: true },
  { id: 'fl_2', title: 'Trivia del Dia de los Beatles', image: svgFlyer('Trivia de los Beatles', '#6a5cff', '#35d07f'), link: 'https://forms.office.com/r/y8uYwkyAF5', isHome: false },
  { id: 'fl_3', title: 'Town Hall SEPO', image: svgFlyer('Town Hall SEPO', '#ff5c72', '#9b30ff'), link: '', isHome: false },
  { id: 'fl_4', title: 'Concurso de Fotografia', image: svgFlyer('Concurso de Fotografia', '#ffb020', '#ff5c72'), link: '', isHome: false },
]

// ---------------------------------------------------------------------------
// "AI is your ally" magazine EDITIONS (one per month, past months kept).
// Shown as a page-flip magazine inside Home. Each edition is EITHER:
//   - kind: 'pdf'    -> `pdf` is a data URL / URL; pages rendered on demand
//                       (react-pdf), lazy so memory stays low even at ~50 pages.
//   - kind: 'images' -> `pages` is a list of 800x1131 image URLs.
// The admin uploads one PDF per month (or images) and old months stay browsable.
// `id` is a stable month key (YYYY-MM). `current` marks the edition shown first.
// ---------------------------------------------------------------------------
export const AI_EDITIONS = [
  {
    id: '2026-07', label: 'Julio 2026', kind: 'images', current: true,
    pages: [
      svgPage('AI is your ally', 'Edicion Julio 2026', '#281b47', '#6F367D'),
      svgPage('Resume casos', 'IA para resumir tickets largos', '#6F367D', '#9F86D7'),
      svgPage('Redacta mejor', 'Plantillas asistidas por IA', '#594094', '#D1A0E2'),
      svgPage('Ahorra tiempo', 'Automatiza lo repetitivo', '#9F86D7', '#281b47'),
    ],
  },
  {
    id: '2026-06', label: 'Junio 2026', kind: 'images', current: false,
    pages: [
      svgPage('AI is your ally', 'Edicion Junio 2026', '#281b47', '#594094'),
      svgPage('Prompt basics', 'Como pedirle bien a la IA', '#594094', '#9F86D7'),
    ],
  },
]

// News / announcements - shown on Home. Fully modular from /admin.
export const NEWS = [
  {
    id: 'news_1',
    title: 'VIBEverse ya esta aqui',
    body: 'El nuevo centro de todo lo VIBE. Encuentra trivias, eventos en vivo, el calendario y todos los links en un solo lugar.',
    date: '2026-07-15',
    tag: 'Lanzamiento',
    pinned: true,
  },
  {
    id: 'news_2',
    title: 'Nominaciones de Julio abiertas',
    body: 'Managers de SEPO: las nominaciones para el Summit Star y Momentum Award de julio ya estan abiertas. Cierran el 31.',
    date: '2026-07-10',
    tag: 'Rewards',
    pinned: false,
  },
  {
    id: 'news_3',
    title: 'Resultados: Logo Winner',
    body: 'Gracias a todos los que participaron en el concurso del logo. Ya anunciamos al ganador en el canal de Slack.',
    date: '2026-07-02',
    tag: 'Concurso',
    pinned: false,
  },
]

// Quick links - the scattered URLs from the extension, now first-class.
// `icon` is a Lucide icon name (see components/Icon.jsx). Fully modular.
export const QUICK_LINKS = [
  { id: 'ql_1', label: 'Buzon de Sugerencias', url: 'https://forms.office.com/r/y8uYwkyAF5', icon: 'idea', category: 'Feedback' },
  { id: 'ql_2', label: 'SharePoint de Arte', url: 'https://sharepoint.amazon.com/vibe-art', icon: 'art', category: 'Managers', managerOnly: true },
  { id: 'ql_3', label: 'Canal de Slack VIBE', url: 'https://amazon.enterprise.slack.com', icon: 'slack', category: 'Comunidad' },
  { id: 'ql_4', label: 'Wiki de VIBE', url: 'https://w.amazon.com/bin/view/VIBE', icon: 'wiki', category: 'Recursos' },
  { id: 'ql_5', label: 'Reporte de Aniversarios', url: 'https://ms.office.com/r/dqTj4MpyU7', icon: 'trophy', category: 'Recursos' },
  { id: 'ql_6', label: 'Calendario SEPO', url: '#/calendar', icon: 'calendar', category: 'Recursos' },
]

// Icon options offered in the admin quick-link editor.
export const LINK_ICON_OPTIONS = ['link', 'idea', 'art', 'slack', 'wiki', 'trophy', 'calendar', 'brain', 'contest', 'ticket', 'users', 'star']

// Active trivias - cards that link out to Microsoft Forms (no scoring in-app).
export const TRIVIAS = [
  {
    id: 'tv_1',
    title: 'Trivia del Dia de los Beatles',
    description: 'Cuanto sabes sobre la banda mas famosa de la historia. Participa.',
    url: 'https://forms.office.com/r/y8uYwkyAF5',
    opensAt: '2026-07-14',
    closesAt: '2026-07-20',
  },
  {
    id: 'tv_2',
    title: 'Trivia de Cultura General SEPO',
    description: 'Preguntas sobre nuestra organizacion y valores. Premios para los primeros lugares.',
    url: 'https://forms.office.com/r/dqTj4MpyU7',
    opensAt: '2026-07-18',
    closesAt: '2026-07-25',
  },
]

// ---------------------------------------------------------------------------
// Calendar events / activities
// ---------------------------------------------------------------------------
// Model (inspired by Google Calendar / Luma / Asana):
//   date       -> when the activity happens (start). Required. YYYY-MM-DD.
//   endDate    -> optional end for multi-day activities (ranges).
//   deadline   -> optional due moment: RSVP cutoff, submission deadline, etc.
//   deadlineLabel -> what the deadline means (ej. "Cierre de inscripcion").
//   type       -> drives color/icon.
//   owner      -> responsible VIBE member.
// Live / upcoming / ended state is DERIVED from dates at render time
// (see lib/eventState.js), not stored, so it is always accurate.
export const EVENT_TYPES = ['Evento', 'Trivia', 'En vivo', 'Flyer', 'Concurso', 'Deadline']

export const EVENTS = [
  { id: 'ev_1', title: 'VIBE Buddy launch', date: '2026-07-04', type: 'Evento', owner: 'varseana' },
  { id: 'ev_2', title: 'Trivia del Dia de los Beatles', date: '2026-07-16', type: 'Trivia', owner: 'sotoarta', deadline: '2026-07-16', deadlineLabel: 'Cierre de participacion' },
  { id: 'ev_3', title: 'Town Hall SEPO en vivo', date: '2026-07-15', endDate: '2026-07-15', type: 'En vivo', owner: 'fiorejr' },
  { id: 'ev_4', title: 'Did you know Dia del Amigo', date: '2026-07-20', type: 'Flyer', owner: 'krojasca' },
  { id: 'ev_5', title: 'Concurso de Fotografia', date: '2026-07-25', type: 'Concurso', owner: 'mercbarq', deadline: '2026-07-23', deadlineLabel: 'Cierre de envio de fotos' },
  { id: 'ev_6', title: 'Semana de Bienestar SEPO', date: '2026-07-27', endDate: '2026-07-31', type: 'Evento', owner: 'jasaguer', deadline: '2026-07-24', deadlineLabel: 'Cierre de inscripcion' },
  { id: 'ev_7', title: 'Cierre nominaciones R&R', date: '2026-07-31', type: 'Deadline', owner: 'varseana' },
]

// Birthdays (this month sample) - from Birthdays.tsv
export const BIRTHDAYS = [
  { id: 'bd_1', login: 'melanny', manager: 'gacris', day: 20, month: 'July' },
  { id: 'bd_2', login: 'corderoo', manager: 'munguivi', day: 12, month: 'July' },
  { id: 'bd_3', login: 'torrart', manager: 'pkammeye', day: 25, month: 'July' },
  { id: 'bd_4', login: 'davisanc', manager: 'esarriet', day: 4, month: 'July' },
  { id: 'bd_5', login: 'yordanob', manager: 'badras', day: 28, month: 'July' },
]

// Amaversaries (this month sample) - computed from HireDates.tsv
export const AMAVERSARIES = [
  { id: 'am_1', login: 'varseana', manager: 'badras', day: 8, month: 'July', years: 3 },
  { id: 'am_2', login: 'fccastl', manager: 'arcalej', day: 15, month: 'July', years: 5 },
  { id: 'am_3', login: 'jasaguer', manager: 'munguivi', day: 22, month: 'July', years: 2 },
]

// ---------------------------------------------------------------------------
// Rewards & Recognition - MODULAR award catalog
// ---------------------------------------------------------------------------
// Each award is a self-describing record with a STABLE id (never changes, used
// by nominations) and editable display fields (name/description/criteria...).
// Admins add/edit/archive awards from /admin; the nomination dropdowns are
// built from this data, never from hardcoded arrays.
//
// Key design choices (data-integrity best practices):
//   - `id` is a stable machine key. Nominations store award.id, so renaming an
//     award never breaks history.
//   - `active` is a soft-delete flag. Archived awards disappear from the
//     nominate dropdown but still resolve for past nominations (no broken refs).
//   - `order` controls display order within a cadence.
// Fields per award:
//   id, name, cadence, description (what it is), why (why it's given),
//   eligibility (who qualifies), example (a good nomination example),
//   icon (Lucide name), active, order
// ---------------------------------------------------------------------------
export const AWARDS = [
  {
    id: 'awd_on_the_spot', name: 'On the Spot', cadence: 'Weekly', icon: 'sparkles', active: true, order: 1,
    description: 'Gift card rapida para un resultado puntual y sobresaliente de la semana.',
    why: 'Reconocer en el momento una metrica o accion destacada, sin esperar al fin de mes.',
    eligibility: 'Cualquier investigador. El manager puede darla varias veces al mes.',
    example: 'Mejor resolucion en primer contacto de la semana segun el dashboard.',
  },
  {
    id: 'awd_summit_star', name: 'Summit Star', cadence: 'Monthly', icon: 'star', active: true, order: 1,
    description: 'El investigador destacado del mes por su desempeno integral en las metricas.',
    why: 'Reconocer consistencia sobresaliente en calidad y resultados durante el mes.',
    eligibility: 'Investigadores individuales. Un ganador por equipo por mes.',
    example: 'Supero todas las metas de calidad del mes manteniendo el mejor CSAT del equipo.',
  },
  {
    id: 'awd_momentum', name: 'Momentum Award', cadence: 'Monthly', icon: 'trophy', active: true, order: 2,
    description: 'Para quien mostro la mayor mejora o impulso en el mes.',
    why: 'Premiar el progreso y el crecimiento, no solo el desempeno absoluto.',
    eligibility: 'Colaboradores que mostraron una mejora notable respecto al mes anterior.',
    example: 'Paso de estar bajo meta a liderar el equipo en resolucion en primer contacto.',
  },
  {
    id: 'awd_rockstar', name: 'Rockstar Award', cadence: 'Quarterly', icon: 'award', active: true, order: 1,
    description: 'El desempeno mas sobresaliente del trimestre.',
    why: 'Reconocer un impacto sostenido y de alto nivel a lo largo del trimestre.',
    eligibility: 'Colaboradores individuales con resultados excepcionales el trimestre.',
    example: 'Lidero la iniciativa de reduccion de reprocesos que ahorro 200 horas al trimestre.',
  },
  {
    id: 'awd_innovation', name: 'Innovation Award', cadence: 'Quarterly', icon: 'idea', active: true, order: 2,
    description: 'Reconoce una idea o mejora que cambio la forma de trabajar.',
    why: 'Fomentar la innovacion (Invent and Simplify) y las mejoras de proceso.',
    eligibility: 'Cualquier colaborador o equipo con una idea implementada de impacto.',
    example: 'Creo una macro que automatizo un reporte manual diario de 30 minutos.',
  },
  {
    id: 'awd_manager_spotlight', name: 'Manager Spotlight', cadence: 'Quarterly', icon: 'users', active: true, order: 3,
    description: 'Reconoce a un manager por su liderazgo en el trimestre.',
    why: 'Destacar a lideres que desarrollan a su gente y dan el ejemplo.',
    eligibility: 'Managers de SEPO.',
    example: 'Su equipo tuvo la mayor mejora de engagement y cero rotacion el trimestre.',
  },
  {
    id: 'awd_senior_spotlight', name: 'Senior Spotlight', cadence: 'Quarterly', icon: 'star', active: true, order: 4,
    description: 'Reconoce a un colaborador senior por su mentoria e impacto.',
    why: 'Valorar a quienes elevan al equipo compartiendo experiencia.',
    eligibility: 'Colaboradores senior.',
    example: 'Mentoreo a tres nuevos ingresos que alcanzaron meta en tiempo record.',
  },
  {
    id: 'awd_pillar', name: 'The Pillar Award', cadence: 'Annual', icon: 'trophy', active: true, order: 1,
    description: 'El maximo reconocimiento anual a un colaborador ejemplar.',
    why: 'Honrar a quien encarna los valores de SEPO durante todo el ano.',
    eligibility: 'Colaboradores individuales. Un ganador al ano.',
    example: 'Referente de cultura y resultados; el estandar que todos buscan seguir.',
  },
  {
    id: 'awd_manager_year', name: 'Manager of the Year', cadence: 'Annual', icon: 'users', active: true, order: 2,
    description: 'El mejor liderazgo del ano.',
    why: 'Reconocer al manager con el mayor impacto en su gente y resultados.',
    eligibility: 'Managers de SEPO.',
    example: 'Transformo un equipo de bajo desempeno en el numero uno de la region.',
  },
  {
    id: 'awd_senior_year', name: 'Senior of the Year', cadence: 'Annual', icon: 'star', active: true, order: 3,
    description: 'El colaborador senior mas influyente del ano.',
    why: 'Premiar el impacto tecnico y humano sostenido durante el ano.',
    eligibility: 'Colaboradores senior.',
    example: 'Su mentoria y expertise elevaron el nivel de toda la operacion.',
  },
]

// Cadence catalog (also editable-friendly). Order matters for the UI.
export const CADENCES = ['Weekly', 'Monthly', 'Quarterly', 'Annual']

// The "current" period per cadence (demo clock is 2026-07-15). Any nomination
// for a period other than these is a RETROACTIVE nomination.
export const CURRENT_PERIOD = { Weekly: 'W29 2026', Monthly: 'July 2026', Quarterly: 'Q3 2026', Annual: '2026' }

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Selectable periods per cadence: the current one first, then several past ones
// so managers can submit retroactive nominations (e.g. Q1 prizes during Q2).
export function periodOptions(cadence) {
  if (cadence === 'Weekly') return Array.from({ length: 10 }, (_, i) => `W${29 - i} 2026`)
  if (cadence === 'Quarterly') return ['Q3 2026', 'Q2 2026', 'Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025']
  if (cadence === 'Annual') return ['2026', '2025', '2024']
  // Monthly: 12 months back from July 2026
  const out = []
  let y = 2026, m = 6
  for (let i = 0; i < 12; i++) {
    out.push(`${MONTHS_EN[m]} ${y}`)
    m--; if (m < 0) { m = 11; y-- }
  }
  return out
}

// Tips for writing a strong nomination (shown inline in the nominate flow).
export const NOMINATION_TIPS = [
  'Basate en las metricas de desempeno del dashboard del investigador.',
  'Se especifico: describe la accion o el resultado concreto.',
  'Muestra el impacto: en el cliente, el equipo o el negocio.',
  'Si es de un periodo anterior, marca el periodo correcto (retroactivo).',
]

// Program context shown at the top of Rewards. Reflects how VIBE runs R&R.
export const PROGRAM_INFO = 'Los managers tienen autonomia total: revisan las metricas de sus investigadores, deciden el premio y envian la nominacion. El submission es final, no requiere aprobacion. VIBE solo recibe la nominacion y entrega el premio (gift card u otro reconocimiento), incluyendo premios de periodos anteriores.'

// Existing nominations (demo). Reference the STABLE award id + a snapshot of the
// award name. `deliveryStatus` tracks VIBE delivery (not approval). `retroactive`
// marks nominations for a past period.
export const REWARDS = [
  { id: 'rew_1', awardId: 'awd_summit_star', awardName: 'Summit Star', cadence: 'Monthly', period: 'July 2026', retroactive: false, nominee: 'davisanc', reason: 'Supero todas las metas de calidad del mes segun el dashboard.', nominatedBy: 'esarriet', deliveryStatus: 'pending' },
  { id: 'rew_2', awardId: 'awd_on_the_spot', awardName: 'On the Spot', cadence: 'Weekly', period: 'W29 2026', retroactive: false, nominee: 'corderoo', reason: 'Mejor resolucion en primer contacto de la semana.', nominatedBy: 'munguivi', deliveryStatus: 'delivered', deliveredBy: 'varseana' },
  { id: 'rew_3', awardId: 'awd_rockstar', awardName: 'Rockstar Award', cadence: 'Quarterly', period: 'Q1 2026', retroactive: true, nominee: 'melanny', reason: 'Mejor desempeno del Q1, entregado de forma retroactiva.', nominatedBy: 'badras', deliveryStatus: 'pending' },
]

// Reward deadlines (countdown). Costa Rica time (UTC-6), 17:00 close.
export const REWARD_DEADLINES = [
  { cadence: 'Weekly', period: 'W29 2026', dueAt: '2026-07-20T23:00:00Z', custom: false },
  { cadence: 'Monthly', period: 'July 2026', dueAt: '2026-08-01T23:00:00Z', custom: false },
  { cadence: 'Quarterly', period: 'Q3 2026', dueAt: '2026-10-01T23:00:00Z', custom: false },
  { cadence: 'Annual', period: '2026', dueAt: '2027-01-01T23:00:00Z', custom: false },
]

// Role allowlist - login -> role. Editable in /admin. Default is 'collaborator'.
// This is the DynamoDB `vibe-roles` table in miniature.
export const ROLE_ALLOWLIST = {
  varseana: 'admin',
  fiorejr: 'admin',
  fccastl: 'admin',
  krojasca: 'admin',
  esarriet: 'sepo_manager',
  munguivi: 'sepo_manager',
  badras: 'sepo_manager',
  gacris: 'manager',
  pkammeye: 'manager',
  arcalej: 'manager',
}
