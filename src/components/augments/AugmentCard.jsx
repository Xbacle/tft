import { Link } from 'react-router-dom'
import { useTftData } from '../../services/dataLoader'
import { createAssetRepository } from '../../services/assetRepository'
import { resolveTftDescription, extractTftValues } from '../../utils/tftText'
import { humanizeTag } from '../../utils/labels'
import Chip from '../common/Chip'
import AugmentTierFrame from './AugmentTierFrame'

export default function AugmentCard({ augment }) {
  const { data } = useTftData()
  const assets = createAssetRepository(data?.assets || {})
  const tier = augment.rarity || 'Silver'
  const description = resolveTftDescription(augment, augment.desc)
  const values = extractTftValues(augment, augment.desc)
  return (
    <Link className="augment-card" to={`/augments/${encodeURIComponent(augment.apiName || augment.id)}`}>
      <div className={`augment-visual tier-${tier.toLowerCase()}`}>
        <AugmentTierFrame rarity={tier} icon={assets.getAugmentRarityIcon(augment)} fallbackIcon={assets.getAugmentIcon(augment)} name={augment.name || augment.apiName} />
        <span className={`augment-tier-badge tier-${tier.toLowerCase()}`}>{tier}</span>
      </div>
      <div className="augment-body">
        <div className="augment-title"><h3>{augment.name || augment.en_name || 'Unknown augment'}</h3></div>
        <div className="augment-copy line-clamp">{description}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(augment.tags || []).filter((tag) => /category|variant/i.test(tag)).slice(0, 2).map((tag) => <Chip key={tag}>{humanizeTag(tag)}</Chip>)}
          {values.slice(0, 2).map((value) => <Chip key={value.key}>{value.label}: {value.values.map((v) => v.value).join(' / ')}</Chip>)}
        </div>
      </div>
    </Link>
  )
}
