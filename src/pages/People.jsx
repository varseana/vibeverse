import { useStore } from '../lib/store.jsx'
import Icon from '../components/Icon.jsx'
import { AdminEditBar } from '../components/AdminEdit.jsx'

export default function People() {
  const { birthdays, amaversaries } = useStore()
  // Copy before sorting so we never mutate the store arrays in place.
  const bd = [...birthdays].sort((a, b) => a.day - b.day)
  const am = [...amaversaries].sort((a, b) => a.day - b.day)

  return (
    <div>
      <div className="page-head">
        <h1>Cumple Años y Amaversarios</h1>
        <p>Celebra a tu equipo este mes. Visible para managers.</p>
      </div>

      <AdminEditBar tab="Cumpleanos" label="cumpleanos y amaversarios" />

      <div className="section-title"><Icon name="cake" size={15} /><span>Cumple Años de Julio</span></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead><tr><th>Login</th><th>Dia</th><th>Mes</th><th>Manager</th></tr></thead>
          <tbody>
            {bd.map((b, i) => (
              <tr key={i}><td>{b.login}</td><td>{b.day}</td><td>{b.month}</td><td className="muted">{b.manager}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title"><Icon name="trophy" size={15} /><span>Amaversarios de Julio</span></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead><tr><th>Login</th><th>Dia</th><th>Anos</th><th>Manager</th></tr></thead>
          <tbody>
            {am.map((a, i) => (
              <tr key={i}>
                <td>{a.login}</td><td>{a.day}</td>
                <td><span className="pill badge-good">{a.years} anos</span></td>
                <td className="muted">{a.manager}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
