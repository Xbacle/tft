export function humanizeId(value = '') {
  const raw = String(value ?? '').trim()
  if (!raw) return 'N/A'
  return raw
    .replace(/^DA_18_/, '')
    .replace(/^DA_/, '')
    .replace(/^TFT18_/, '')
    .replace(/^TFT_/, '')
    .replace(/^TFTCalculationAttributes\./, '')
    .replace(/^Role\./, '')
    .replace(/_Radiant$/i, ' Radiant')
    .replace(/_AP$/i, ' AP')
    .replace(/_AD$/i, ' AD')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bAp\b/g, 'AP')
    .replace(/\bAd\b/g, 'AD')
    .replace(/\bMr\b/g, 'MR')
    .replace(/\bHp\b/g, 'HP')
    .replace(/\bAs\b/g, 'AS')
    .replace(/\bMs\b/g, 'MS')
    .replace(/\bCritchance\b/gi, 'Crit Chance')
    .replace(/\bTft\b/g, 'TFT')
    .replace(/\bPct\b/gi, '%')
    .replace(/\s+/g, ' ')
    .trim()
}

export function humanizeTag(value = '') {
  return String(value ?? '')
    .replace(/^Item\.Equippable\.Category\./, '')
    .replace(/^Item\.Equippable\.Item\./, '')
    .replace(/^Item\.Equippable\.Potion\./, '')
    .replace(/^Item\.Equippable\.Reusable\./, '')
    .replace(/^Augment\.Category\./, '')
    .replace(/^Augment\.Variant\./, '')
    .replace(/^Augment\.Property\./, '')
    .replace(/^Augment\.Complexity\./, '')
    .replace(/^Augment\.Mode\./, '')
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bAp\b/g, 'AP')
    .replace(/\bAd\b/g, 'AD')
    .replace(/\s+/g, ' ')
    .trim()
}

export function rarityRank(rarity) {
  return { Silver: 1, Gold: 2, Prismatic: 3 }[rarity] ?? 0
}

export function roleLabel(role = '', roleData = null) {
  const dataName = roleData?.[role]?.name
  if (dataName) return dataName
  const raw = String(role).replace(/^DA_Role_/, '')
  if (!raw) return 'N/A'
  return raw
    .replace(/_Manaless$/i, ' • Manaless')
    .replace(/_Rage$/i, ' • Rage')
    .replace(/_Ammo$/i, ' • Ammo')
    .replace(/_Time$/i, ' • Time')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
}

export function uniqueByKey(items = [], getKey = (item) => item) {
  const seen = new Set()
  return items.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
