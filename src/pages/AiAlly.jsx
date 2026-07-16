import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Magazine from '../components/Magazine.jsx'
import Icon from '../components/Icon.jsx'

// "AI is your ally" magazine, in its own public tab. Because this whole route
// is code-split (React.lazy in App), pdf.js and the flip engine only load when
// a user opens this page, keeping the rest of the app light.
export default function AiAlly() {
  const { aiEditions } = useStore()
  const editions = [...(aiEditions || [])].sort((a, b) => b.id.localeCompare(a.id))
  const [editionId, setEditionId] = useState(() => (editions.find((e) => e.current) || editions[0])?.id)
  const edition = editions.find((e) => e.id === editionId) || editions[0]

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

      <Magazine edition={edition} />
    </div>
  )
}
