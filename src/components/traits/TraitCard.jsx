import { Link } from 'react-router-dom'
import { useTftData } from '../../services/dataLoader'
import { createAssetRepository } from '../../services/assetRepository'
import AssetImage from '../common/AssetImage'
import { resolveTftDescription } from '../../utils/tftText'

export default function TraitCard({ trait, unitCount: unitCountProp }) {
  const { data } = useTftData()
  const assets = createAssetRepository(data?.assets || {})
  const unitCount = unitCountProp ?? (trait.units || []).length
  return (
    <Link className="entity-card trait-entity-card" to={`/traits/${encodeURIComponent(trait.apiName)}`}>
      <div className="trait-card-icon-clean"><AssetImage src={assets.getTraitIcon(trait)} alt={trait.name} label={trait.name} className="h-16 w-16 object-contain" /></div>
      <div className="entity-card-body">
        <div className="flex items-center justify-between gap-2"><div className="entity-name">{trait.name || trait.en_name || 'Unknown trait'}</div><span className="text-[10px] text-slate-500">{unitCount} units</span></div>
        <div className="entity-meta line-clamp">{resolveTftDescription(trait, trait.desc)}</div>
      </div>
    </Link>
  )
}
