import { useEffect, useState } from 'react'
import PlaceholderIcon from '../common/PlaceholderIcon'
import { createAssetRepository } from '../../services/assetRepository'
import { useTftData } from '../../services/dataLoader'

export function getUnitAssetPaths(apiName) {
  const id = String(apiName || '').toLowerCase()
  return { icon: `/assets/units/optimized/${id}.webp`, splash: `/assets/units/optimized/${id}.webp` }
}

export default function UnitImage({ unit, type = 'icon', className = '', size = '' }) {
  const { data } = useTftData(); const assets = createAssetRepository(data?.assets || {})
  const primary = type === 'splash' ? assets.getUnitSplash(unit) : assets.getUnitIcon(unit)
  const fallback = type === 'splash' ? assets.getUnitSplashFallback(unit) : assets.getUnitIconFallback(unit)
  const [src, setSrc] = useState(primary)
  useEffect(() => setSrc(primary), [primary])
  if (!unit || !src) return <PlaceholderIcon label={unit?.name || 'N/A'} size={size} />
  const cost = Number(unit?.cost)
  const costClass = Number.isFinite(cost) && cost >= 1 && cost <= 5 ? `unit-cost-${cost}` : ''
  return <img src={src} alt={unit.name || 'TFT champion'} className={`unit-image unit-image-${type} tft-asset-sharp ${costClass} ${className}`.trim()} loading="lazy" decoding="async" fetchPriority={type === 'splash' ? 'auto' : 'low'} onError={() => setSrc((current) => current === fallback ? '' : fallback)} />
}
