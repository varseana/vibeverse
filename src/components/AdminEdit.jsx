import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { sfx } from '../lib/sfx.js'
import Icon from './Icon.jsx'

// ---------------------------------------------------------------------------
// AdminEdit: atajos de edicion visibles SOLO para el equipo VIBE (isAdmin).
// Para cualquier otro rol no renderiza nada (queda invisible en el DOM).
//
// Lleva al panel de Admin ya posicionado: /admin?tab=<tab>&focus=<id>. El Admin
// lee esos parametros para abrir el tab, hacer scroll al item y abrir su editor.
//
// Dos formas:
//   <AdminEditBar tab="Trivias" label="trivia" />         -> barra de seccion
//     (boton "editar" al tab + boton "agregar" con focus=new)
//   <AdminEditButton tab="Trivias" id={t.id} />           -> lapiz por item
//     (aparece en hover sobre un card; el contenedor debe ser position:relative)
// ---------------------------------------------------------------------------

function useAdminNav() {
  const navigate = useNavigate()
  return (tab, focus) => {
    sfx.play('edit')
    const params = new URLSearchParams({ tab })
    if (focus) params.set('focus', focus)
    navigate(`/admin?${params.toString()}`)
  }
}

// Per-item pencil. Sits in the corner of a card; only VIBE sees it.
export function AdminEditButton({ tab, id, title = 'Editar (equipo VIBE)' }) {
  const { isAdmin } = useAuth()
  const go = useAdminNav()
  if (!isAdmin) return null
  return (
    <button
      className="admin-edit-btn"
      data-sfx="off"
      title={title}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(tab, id) }}
    >
      <Icon name="settings" size={13} />
    </button>
  )
}

// Section-level bar: "editar" + "agregar". Only VIBE sees it.
export function AdminEditBar({ tab, label = 'contenido', style }) {
  const { isAdmin } = useAuth()
  const go = useAdminNav()
  if (!isAdmin) return null
  return (
    <div className="admin-edit-bar" style={style}>
      <span className="admin-edit-tag"><Icon name="sparkles" size={12} /> VIBE</span>
      <button className="btn ghost sm" data-sfx="off" onClick={() => go(tab)}>
        <Icon name="settings" size={13} /> Editar {label}
      </button>
      <button className="btn ghost sm" data-sfx="off" onClick={() => go(tab, 'new')}>
        <Icon name="plus" size={13} /> Agregar
      </button>
    </div>
  )
}
