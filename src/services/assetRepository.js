function normalizeId(value) { return String(value ?? '').trim().toLowerCase() }
function unitFallback(apiName, type) {
  const id = normalizeId(apiName)
  return `/assets/units/optimized/${id}.webp`
}
function itemFallback(apiName) { return `/assets/items/${normalizeId(apiName)}.png` }
function traitFallback(apiName) { return `/assets/traits/${normalizeId(apiName)}.png` }
function augmentFallback(augment) {
  const icon = String(augment?.icon || '').trim().toLowerCase()
  return icon ? `/assets/augments/${icon}.png` : ''
}
export function isRadiantItem(item) {
  return Boolean(item && ((item.overlays || []).some((o) => String(o?.id || '').toLowerCase() === 'radiant') || (item.itemTags || []).some((t) => /radiant/i.test(t)) || (item.tags || []).some((t) => /radiant/i.test(t)) || /radiant/i.test(item.apiName || '')))
}
function optimized(entry) { return entry?.optimized || null }
export function createAssetRepository(manifest = {}) {
  const units = manifest.units || {}; const items = manifest.items || {}; const traits = manifest.traits || {}; const augments = manifest.augments || {}; const shared = manifest.shared || {}
  return {
    getUnitIcon(unit) { const e = units[unit?.apiName]?.icon; return optimized(e) || e?.local || unitFallback(unit?.apiName, 'icon') },
    getUnitIconFallback(unit) { return units[unit?.apiName]?.icon?.local || unitFallback(unit?.apiName, 'icon') },
    getUnitSplash(unit) { const e = units[unit?.apiName]?.splash; return optimized(e) || e?.local || unitFallback(unit?.apiName, 'splash') },
    getUnitSplashFallback(unit) { return units[unit?.apiName]?.splash?.local || unitFallback(unit?.apiName, 'splash') },
    getItemIcon(item) { const e = items[item?.apiName || item?.id]?.icon; return optimized(e) || e?.local || itemFallback(item?.apiName || item?.id) },
    getItemIconFallback(item) { return items[item?.apiName || item?.id]?.icon?.local || itemFallback(item?.apiName || item?.id) },
    getTraitIcon(trait) { const e = traits[trait?.apiName]?.icon; return optimized(e) || e?.local || traitFallback(trait?.apiName) },
    getAugmentIcon(augment) { const e = augments[augment?.apiName]?.icon; return optimized(e) || e?.local || augmentFallback(augment) },
    getAugmentRarityIcon(augment) {
      const rarity = String(augment?.rarity || 'Silver')
      const original = augments[augment?.apiName]?.rarityLocal || augments[augment?.apiName]?.icon?.local || augmentFallback(augment)
      const fileName = String(original || '').split('/').pop()
      if (!fileName) return original
      return augments[augment?.apiName]?.variants?.[rarity] || `/assets/augments/rarity/${rarity}/${fileName}`
    },
    getAugmentAssetRecord(augment) { return augments[augment?.apiName] || null },
    getSharedAsset(key) { return shared[key]?.optimized || shared[key]?.local || null },
  }
}
