import { useState } from 'react'
import PlaceholderIcon from './PlaceholderIcon'

export default function AssetImage({ src, alt, label, className = '', fallbackSize = 'md', ...props }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <PlaceholderIcon label={label || alt} size={fallbackSize} />
  return <img src={src} alt={alt || label || 'TFT asset'} className={`tft-asset-sharp ${className}`.trim()} loading="lazy" onError={() => setFailed(true)} {...props} />
}
