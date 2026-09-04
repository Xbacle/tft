export default function AIButton({ onClick, disabled = false }) {
  return <button className="ai-button" onClick={onClick} disabled={disabled} aria-label="Open TFT AI Helper" title="TFT AI Coach">✦</button>
}
