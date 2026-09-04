import { useState } from 'react'
import PlaceholderIcon from '../common/PlaceholderIcon'

function rarityKey(rarity = 'Silver') {
  return String(rarity).toLowerCase() === 'prismatic' ? 'Prismatic' : rarity
}

export default function AugmentTierFrame({ rarity = 'Silver', icon, fallbackIcon, name, className = '' }) {
  const [failed, setFailed] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)
  const src = failed ? fallbackIcon : icon
  const tier = rarityKey(rarity)
  return <div className={`augment-icon-stage rarity-${String(tier).toLowerCase()} ${className}`.trim()}>
    <span className="augment-sparkles" aria-hidden="true" />
    {src && !(failed && fallbackFailed)
      ? <img src={src} alt={name || 'Augment'} className="augment-raster-icon" onError={() => (failed ? setFallbackFailed(true) : setFailed(true))} />
      : <PlaceholderIcon label={name} size="lg" />}
  </div>
}
