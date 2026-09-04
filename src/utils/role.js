export function roleFamilyLabel(tag = '') {
  const value = String(tag || '').replace(/^Role\./, '')
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim()
}

export function getUnitRoleTags(unit, roleData = {}) {
  const tags = roleData?.[unit?.role]?.roleTags || []
  const labels = tags.map(roleFamilyLabel).filter(Boolean)
  return [...new Set(labels)]
}

export function roleMatches(unit, selected, roleData = {}) {
  if (!selected || selected === 'all') return true
  if (unit?.role === selected) return true
  return getUnitRoleTags(unit, roleData).includes(roleFamilyLabel(selected))
}
