import AssetImage from '../common/AssetImage'
import { isRadiantItem } from '../../services/assetRepository'

export default function ItemIcon({ item, src, size = 'md', className = '' }) {
  const radiant = isRadiantItem(item)
  const sizes = { xs: 'h-8 w-8', sm: 'h-10 w-10', md: 'h-14 w-14', lg: 'h-20 w-20' }
  return (
    <div className={`item-icon ${radiant ? 'item-icon-radiant' : ''} ${sizes[size] || sizes.md} ${className}`.trim()}>
      <AssetImage src={src} alt={item?.name} label={item?.name} className="h-full w-full object-contain" fallbackSize="xs" />
    </div>
  )
}
