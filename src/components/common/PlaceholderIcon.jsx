export default function PlaceholderIcon({ label, size = 'md' }) {
  const text = String(label || '?').replace(/^(DA_18_|TFT18_|TFT_Item_)/, '')
  return <div className={`placeholder-icon ${size}`} title={label}>{text.slice(0, 3).toUpperCase()}</div>
}
