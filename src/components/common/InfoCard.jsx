import { Link } from 'react-router-dom'

export default function InfoCard({ to, title, description, stat, eyebrow = 'REFERENCE' }) {
  return <Link to={to} className="info-topic-card group">
    <div className="eyebrow">{eyebrow}</div>
    <div className="mt-2 flex items-start justify-between gap-4">
      <h3>{title}</h3>
      <span className="info-topic-arrow">→</span>
    </div>
    <p>{description}</p>
    {stat && <div className="info-topic-stat">{stat}</div>}
  </Link>
}
