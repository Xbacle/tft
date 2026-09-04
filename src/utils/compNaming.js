function resolvedIds(csv = '') {
  return String(csv).split(',').map((value) => value.trim()).filter(Boolean)
}

function uniqueUnits(comp, repo) {
  const seen = new Set()
  const result = []
  for (const id of resolvedIds(comp.units_string)) {
    const unit = repo.getUnit(id)
    if (!unit || seen.has(unit.apiName)) continue
    seen.add(unit.apiName)
    result.push(unit)
  }
  return result
}

function scoredEntries(comp, type, repo, getter) {
  return (comp.name || [])
    .filter((entry) => entry?.type === type)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .map((entry) => getter(entry.name, repo))
    .filter(Boolean)
}

function primaryCarry(comp, repo) {
  const scored = scoredEntries(comp, 'unit', repo, (id, r) => r.getUnit(id))
  if (scored[0]) return scored[0]
  const build = [...(comp.builds || [])].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0]
  return build ? repo.getUnit(build.unit) : null
}

function notableTraits(comp, repo) {
  return scoredEntries(comp, 'trait', repo, (id, r) => r.getTrait(id))
}

function strongestFrontline(comp, repo, carry) {
  const candidates = (comp.builds || [])
    .map((build) => ({ build, unit: repo.getUnit(build.unit) }))
    .filter(({ unit }) => unit && unit.apiName !== carry?.apiName)
    .filter(({ unit }) => (unit.roleTags || []).some((tag) => /Tank/i.test(tag)) || /Tank/i.test(repo.getRoleData()?.[unit.role]?.name || ''))
    .sort((a, b) => (b.build?.count ?? 0) - (a.build?.count ?? 0))
  return candidates[0]?.unit || null
}

function styleLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'Flex'
  if (/^lvl\s*6$/i.test(raw)) return 'Level 6 Reroll'
  if (/^lvl\s*7$/i.test(raw)) return 'Level 7 Reroll'
  if (/^lvl\s*8$/i.test(raw)) return 'Level 8'
  if (/^lvl\s*9$/i.test(raw)) return 'Fast 9'
  return raw.replace(/^lvl\s*/i, 'Level ')
}

function stableIndex(key, length) {
  if (!length) return 0
  let hash = 0
  for (const char of String(key || '')) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  return Math.abs(hash) % length
}

function buildTitle(comp, identityBits) {
  const { carry, leadTrait, secondTrait, tank, style } = identityBits
  const candidates = []
  if (leadTrait?.name && secondTrait?.name && carry?.name) candidates.push(`${leadTrait.name} ${secondTrait.name}`)
  if (leadTrait?.name && carry?.name) candidates.push(`${leadTrait.name} ${carry.name}`)
  if (carry?.name && tank?.name) candidates.push(`${carry.name} & ${tank.name}`)
  if (carry?.name) candidates.push(`${carry.name} Carry`)
  if (leadTrait?.name && style.includes('Reroll')) candidates.push(`${leadTrait.name} Reroll`)
  if (leadTrait?.name) candidates.push(`${leadTrait.name} Core`)
  return candidates[stableIndex(comp.Cluster || comp.name_string, candidates.length)] || 'Team Composition'
}

export function getCompIdentity(comp, repo) {
  const units = uniqueUnits(comp, repo)
  const carry = primaryCarry(comp, repo)
  const traits = notableTraits(comp, repo)
  const tank = strongestFrontline(comp, repo, carry)
  const leadTrait = traits[0]
  const secondTrait = traits[1]
  const style = styleLabel(comp.levelling)
  const title = buildTitle(comp, { carry, leadTrait, secondTrait, tank, style })
  const secondaryParts = [style]
  if (carry?.name) secondaryParts.push(`Carry: ${carry.name}`)
  if (tank?.name) secondaryParts.push(`Frontline: ${tank.name}`)
  secondaryParts.push(`${units.length} champions`)

  const searchable = [
    title,
    secondaryParts.join(' '),
    comp.name_string,
    ...(comp.traits_string || '').split(',').map((id) => id.trim()),
    ...units.map((unit) => `${unit.name} ${unit.en_name || ''}`),
    ...traits.map((trait) => `${trait.name} ${trait.en_name || ''}`),
  ].join(' ')

  return { title, secondary: secondaryParts.join(' · '), style, carry, trait: leadTrait || null, traits, tank, units, searchable }
}

export function recentPlaceChange(comp) {
  const trends = Array.isArray(comp?.trends) ? comp.trends : []
  if (trends.length < 2) return null
  const current = Number(trends[trends.length - 1]?.avg)
  const previous = Number(trends[trends.length - 2]?.avg)
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  return current - previous
}
