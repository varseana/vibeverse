import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

// Promo block for "AI is your ally": the standalone IDEA FLYER fills the LEFT
// HALF, and the RIGHT HALF holds the editable description plus a button to learn
// more about the idea in the AIRO store and a button to open the magazine.
// The idea flyer is a SEPARATE thing from the magazine (the multi-page read):
// this shows the single image with one colleague's idea, not the magazine cover.
// Used on Home and previewed in Admin.
export default function AiAllyPromo({ edition, showMagazineButton = true }) {
  // Track which src finished loading so the skeleton reappears when the edition
  // (and thus the flyer) changes, e.g. in the Admin preview.
  const [loadedSrc, setLoadedSrc] = useState(null)
  if (!edition) {
    return <div className="empty">Aun no hay ediciones de AI is your ally.</div>
  }

  const flyer = edition.flyer
  const loaded = loadedSrc === flyer

  return (
    <div className="ally-promo">
      {/* Standalone idea flyer fills the left half (skeleton until it loads) */}
      <div className="ally-promo-flyer">
        {flyer ? (
          <>
            {!loaded && <div className="skeleton skeleton-fill" />}
            <img
              src={flyer} alt={`Flyer de la idea, ${edition.label}`}
              decoding="async" onLoad={() => setLoadedSrc(flyer)}
              style={{ opacity: loaded ? 1 : 0 }}
            />
          </>
        ) : (
          <div className="ally-promo-flyer-fallback"><Icon name="idea" size={40} /><span>{edition.label}</span></div>
        )}
      </div>

      {/* Editable text + actions fill the right half */}
      <div className="ally-promo-body">
        <span className="tag"><Icon name="idea" size={12} /> AI is your ally</span>
        <h3>{edition.label}</h3>
        <p className="ally-promo-desc">{edition.description || 'Ideas de IA de SEPO convertidas en flyers.'}</p>

        <div className="ally-promo-actions">
          {edition.airoUrl && (
            <a className="btn ghost" href={edition.airoUrl} target="_blank" rel="noreferrer">
              <Icon name="external" size={15} /> Ver mas sobre la idea{edition.ideaAuthor ? ` de ${edition.ideaAuthor}` : ''} en AIRO
            </a>
          )}
          {showMagazineButton && (
            <Link className="btn" to="/ai-ally">
              <Icon name="next" size={15} /> Ver la revista
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
