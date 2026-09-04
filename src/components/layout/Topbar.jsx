import { Link } from 'react-router-dom'

export default function Topbar({ onMenu }) {
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu} aria-label="Open menu">☰</button>
    <Link to="/" className="brand"><span className="brand-mark">✦</span><span>TFT 18 <b>HELPER</b></span></Link>
    <div className="topbar-label">SET 18 · WIKI & HELPER</div>
  </header>
}
