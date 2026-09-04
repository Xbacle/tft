import { number, percent } from './format'
import { roleLabel } from './labels'

function clean(value = '') { return String(value ?? '').replace(/\s+/g, ' ').trim() }

export function championOverview(unit, repo) {
  const role = roleLabel(unit?.role, repo?.getRoleData?.() || {})
  const traits = (unit?.traits || []).slice(0, 3)
  const cost = unit?.cost != null ? `${unit.cost}-cost` : 'champion'
  const parts = [cost, role !== 'N/A' ? role : null, traits.length ? `Part of ${traits.join(' · ')}` : null].filter(Boolean)
  return `${clean(unit?.name) || 'This champion'} is a ${parts.join(' · ')}. Below you'll find full stats, ability values and the items players build on them.`
}

export function championUsageHint(unit, stats) {
  if (!unit) return ''
  if (!stats) return 'No match data for this champion yet.'
  const bits = []
  if (Number.isFinite(stats.avg)) bits.push(`average place ${number(stats.avg)}`)
  if (Number.isFinite(stats.pick)) bits.push(`pick rate ${percent(stats.pick)}`)
  if (Number.isFinite(stats.count)) bits.push(`${stats.count.toLocaleString()} tracked games`)
  return bits.length ? `From recent matches: ${bits.join(', ')}. Use this as context — every lobby is different.` : ''
}

export function compPlayerSummary(identity, comp) {
  const lead = identity?.carry?.name ? `${identity.carry.name} is the primary carry` : 'The board has no single carry'
  const tank = identity?.tank?.name ? ` with ${identity.tank.name} as the main frontline anchor` : ''
  const style = identity?.style && identity.style !== 'Flex' ? ` The data points to a ${identity.style.toLowerCase()} approach.` : ''
  const games = Number.isFinite(comp?.overall?.count) ? ` Played in ${comp.overall.count.toLocaleString()} recent matches.` : ''
  return `${lead}${tank}.${style}${games}`
}

export function itemPlayerSummary(item, stats, kindLabel) {
  const kind = kindLabel || 'Item'
  const radiant = /radiant/i.test(item?.apiName || '') ? ' It is a Radiant version.' : ''
  const observed = stats && Number.isFinite(stats.avg) ? ` Champions who built it averaged ${number(stats.avg)} place.` : ''
  return `${kind}${item?.name ? `: ${item.name}` : ''}.${radiant}${observed}`
}

export function traitPlayerSummary(trait, unitCount) {
  const name = clean(trait?.name) || 'This trait'
  const countText = Number.isFinite(unitCount) ? `${unitCount} champions currently have it.` : ''
  return `${name} activates through the champions that carry it. ${countText} Breakpoints below come straight from the game data.`.replace(/\s+/g, ' ').trim()
}

export function augmentPlayerSummary(augment) {
  const name = clean(augment?.name) || 'This augment'
  const rarity = clean(augment?.rarity)
  const rounds = (augment?.rounds || []).filter(Boolean)
  const parts = [rarity ? `${rarity} augment` : 'Augment', rounds.length ? `appears at ${rounds.join(' / ')}` : null].filter(Boolean)
  return `${name} is a ${parts.join(' · ')}. All values below are from the current Set 18 patch.`
}

export function dataFreshnessCopy(summary) {
  const bits = [
    summary?.units ? `${summary.units} champions` : null,
    summary?.items ? `${summary.items} items` : null,
    summary?.traits ? `${summary.traits} traits` : null,
    summary?.augments ? `${summary.augments} augments` : null,
  ].filter(Boolean)
  return bits.length ? `Updated for Set 18 · Enchanted Wilds — ${bits.join(', ')}.` : 'Updated for Set 18 · Enchanted Wilds.'
}
