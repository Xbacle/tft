import { useState } from 'react'

export default function InfoImage({ src, alt = '' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <img src={src} alt={alt} className="info-asset-slot" loading="lazy" onError={() => setFailed(true)} />
}
