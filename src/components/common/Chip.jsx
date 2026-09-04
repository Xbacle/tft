export default function Chip({ children, muted = false }) {
  return <span className={`chip ${muted ? 'muted' : ''}`}>{children}</span>
}
