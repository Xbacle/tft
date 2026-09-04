import { NavLink } from 'react-router-dom'

const links = [
  ['Home', '/'], ['Comps', '/comps'], ['Augments', '/augments'], ['Units', '/units'], ['Items', '/items'], ['Traits', '/traits'], ['Info', '/info'],
]

export default function Sidebar({ open, onClose }) {
  return <>
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-title">NAVIGATION</div>
      <nav>{links.map(([label, to]) => <NavLink key={to} to={to} end={to === '/'} onClick={onClose}>{label}</NavLink>)}</nav>
      <div className="sidebar-footer"><span className="status-dot" /> Set 18 · Enchanted Wilds</div>
    </aside>
    {open && <button className="drawer-backdrop" onClick={onClose} aria-label="Close menu" />}
  </>
}
