import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Magazine from '../components/Magazine.jsx'
import Icon from '../components/Icon.jsx'
import { AdminEditBar } from '../components/AdminEdit.jsx'

// "AI is your ally" magazine, in its own public tab. Because this whole route
// is code-split (React.lazy in App), pdf.js and the flip engine only load when
// a user opens this page, keeping the rest of the app light. The flip reader
// needs a wide screen, so on mobile we show a note instead.
export default function AiAlly() {
  const { aiEditions } = useStore()
  const editions = [...(aiEditions || [])].sort((a, b) => b.id.localeCompare(a.id))
  const [editionId, setEditionId] = useState(() => (editions.find((e) => e.current) || editions[0])?.id)
  const edition = editions.find((e) => e.id === editionId) || editions[0]

  if (!edition) {
    return (
      <div>
        <div className="page-head">
          <div className="skeleton" style={{ width: 220, height: 28, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ width: 380, height: 16, borderRadius: 'var(--radius-sm)', marginTop: 8 }} />
        </div>
        <div className="mag-cover"><div className="mag-cover-inner"><div className="skeleton skeleton-fill" /></div></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1>AI is your ally</h1>
          <p>Ideas de IA de SEPO convertidas en flyers. Pasa las paginas como una revista.</p>
        </div>
        {editions.length > 1 && (
          <select className="mag-month" value={editionId} onChange={(e) => setEditionId(e.target.value)}>
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>{ed.label}{ed.current ? ' (actual)' : ''}</option>
            ))}
          </select>
        )}
      </div>

      <AdminEditBar tab="AI Ally" label="ediciones" />

      {/* Magazine: large on desktop, hidden on mobile (flip needs a wide screen) */}
      <div className="mag-desktop-only">
        <Magazine edition={edition} />
      </div>
      <div className="mag-mobile-note">
        <Icon name="idea" size={18} />
        <span>La revista interactiva esta disponible en computadora. Abrela desde un navegador de escritorio para pasar las paginas.</span>
      </div>
    </div>
  )
}
