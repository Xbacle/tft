import { Link } from 'react-router-dom'
import { useTftData } from '../../services/dataLoader'
import { createAssetRepository, isRadiantItem } from '../../services/assetRepository'
import ItemIcon from './ItemIcon'
import { resolveTftDescription } from '../../utils/tftText'
import { getItemKind, itemKindLabel } from '../../utils/itemType'

export default function ItemCard({ item }) {
  const { data } = useTftData()
  const assets = createAssetRepository(data?.assets || {})
  const text = resolveTftDescription(item, item.desc)
  const radiant = isRadiantItem(item)
  return <Link className={`entity-card ${radiant ? 'entity-card-radiant' : ''}`} to={`/items/${encodeURIComponent(item.apiName || item.id)}`}>
    <div className="item-card-icon"><ItemIcon item={item} src={assets.getItemIcon(item)} size="lg" /></div>
    <div className="entity-card-body">
      <div className="flex items-center justify-between gap-2"><div className="entity-name">{item.name || item.en_name || 'N/A'}</div><span className={`tier-pill ${radiant ? 'tier-pill-radiant' : ''}`}>{itemKindLabel(getItemKind(item))}</span></div>
      <div className="entity-meta line-clamp">{text}</div>
    </div>
  </Link>
}
