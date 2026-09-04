import { createTftRepository } from '../services/tftRepository'
import { analyzeQuery, resolveUnitNames } from './analyzer'
import { clampText } from './text'

const REPO_CACHE = new WeakMap()

function getRepo(data) {
  if (!REPO_CACHE.has(data)) REPO_CACHE.set(data, createTftRepository(data))
  return REPO_CACHE.get(data)
}

function unique(items) {
  return [...new Map(items.filter(Boolean).map((x) => [x.apiName || x.id || x.Cluster || x.name, x])).values()]
}

function unitSummary(repo, unit) {
  const stats = repo.getUnitStats(unit)
  return {
    type: 'unit', name: unit.name, en_name: unit.en_name, apiName: unit.apiName, cost: unit.cost,
    traits: unit.traits, role: unit.role, stats: unit.stats,
    ability: unit.ability ? { name: unit.ability.name, description: clampText(unit.ability.description || unit.ability.desc, 650) } : null,
    recommendedItems: (unit.recommendedItems || []).slice(0, 5),
    performance: stats ? { avg: stats.avg, pick: stats.pick, count: stats.count, items: (stats.items || []).slice(0, 5) } : null,
  }
}

function itemSummary(repo, item) {
  const stats = repo.getItemStats(item)
  return {
    type: 'item', name: item.name, en_name: item.en_name, apiName: item.apiName,
    desc: clampText(item.desc, 650), statLine: clampText(item.statLine, 250), composition: item.composition,
    performance: stats ? { avg: stats.avg, pick: stats.pick, count: stats.count, units: (stats.units || []).slice(0, 5) } : null,
  }
}

function traitSummary(trait) {
  return {
    type: 'trait', name: trait.name, en_name: trait.en_name,
    desc: clampText(trait.desc, 650), effects: (trait.effects || []).slice(0, 4),
    units: (trait.units || []).slice(0, 8),
  }
}

function augmentSummary(augment) {
  return {
    type: 'augment', name: augment.name, apiName: augment.apiName,
    desc: clampText(augment.desc || augment.description, 650),
  }
}

function compSummary(repo, comp) {
  const units = repo.getCompUnits(comp)
  const traits = repo.getCompTraitActivations(comp)
  return {
    type: 'comp', id: comp.Cluster, name: comp.name_string || comp.name || `Comp ${comp.Cluster}`,
    unitNames: units.map((u) => u.name).slice(0, 8),
    traitNames: traits.slice(0, 6).map((x) => ({ name: x.trait.name, count: x.count, activeThreshold: x.activeThreshold, nextThreshold: x.nextThreshold, active: x.isActive })),
    overall: comp.overall, difficulty: comp.difficulty, levelling: comp.levelling,
    topHeadliner: comp.top_headliner, topItems: (comp.top_itemNames || []).slice(0, 5), topAugments: (comp.top_augments || []).slice(0, 4),
  }
}

// Khi câu hỏi liên quan TFT nhưng không nhận diện được thực thể cụ thể,
// gửi "digest" tổng quan (top đội hình mạnh) để AI vẫn có dữ liệu gốc để trả lời.
export function buildDigestContext(data, analysis, maxComps = 4) {
  const repo = getRepo(data)
  const comps = repo.getComps()
    .filter((comp) => Number(comp?.overall?.count) > 0)
    .sort((a, b) => (Number(a.overall?.avg) || 9) - (Number(b.overall?.avg) || 9) || (Number(b.overall?.count) || 0) - (Number(a.overall?.count) || 0))
    .slice(0, maxComps)
  return {
    source: 'local-json-digest',
    intent: analysis?.intent || 'general',
    matched: {},
    chunks: comps.map((comp) => compSummary(repo, comp)),
    dataSummary: repo.getDataSummary(),
  }
}

export function retrieveContext(data, analysis, maxChunks = 5) {
  if (!analysis || analysis.intent === 'greeting') return null
  const hasEntities = Boolean(
    analysis.entities?.units?.length
    || analysis.entities?.items?.length
    || analysis.entities?.traits?.length
    || analysis.entities?.augments?.length,
  )
  if (analysis.intent === 'general') {
    // Chỉ truy xuất khi đã xác định câu hỏi thuộc TFT (mentionsTft = tên thực thể
    // xuất hiện nguyên vẹn trong câu hỏi hoặc có từ khóa game).
    if (!analysis.mentionsTft) return null
    if (!hasEntities) return buildDigestContext(data, analysis)
  }
  const repo = getRepo(data)
  const units = resolveUnitNames(repo, analysis)
  const unitNames = new Set(units.map((u) => u.apiName))
  const itemIds = (analysis.entities?.items || []).map((x) => repo.getItem(x.apiName) || repo.getItem(x.name)).filter(Boolean)
  const traitIds = (analysis.entities?.traits || []).map((x) => repo.getTrait(x.apiName) || repo.getTrait(x.name)).filter(Boolean)
  const augmentIds = (analysis.entities?.augments || []).map((x) => repo.getAugment(x.apiName) || repo.getAugment(x.name)).filter(Boolean)

  const relatedComps = []
  for (const unit of units.slice(0, 2)) relatedComps.push(...repo.getRelatedCompsForUnit(unit))
  for (const trait of traitIds.slice(0, 1)) relatedComps.push(...repo.getRelatedCompsForTrait(trait))

  const rankedComps = unique(relatedComps)
    .map((comp) => {
      const compUnits = repo.getCompUnits(comp)
      const overlap = compUnits.filter((u) => unitNames.has(u.apiName)).length
      return { comp, overlap }
    })
    .sort((a, b) => b.overlap - a.overlap || (Number(b.comp?.overall?.count) || 0) - (Number(a.comp?.overall?.count) || 0))
    .slice(0, 3)

  const selectedItems = itemIds.length
    ? itemIds.slice(0, 3)
    : unique(units.flatMap((u) => (u.recommendedItems || []).map((x) => repo.getItem(x)).filter(Boolean))).slice(0, 3)
  const selectedTraits = traitIds.length
    ? traitIds.slice(0, 2)
    : unique(units.flatMap((u) => (u.traitApiNames || []).map((id) => repo.getTrait(id)).filter(Boolean))).slice(0, 2)

  const chunks = []
  units.slice(0, 2).forEach((u) => chunks.push(unitSummary(repo, u)))
  selectedItems.forEach((item) => chunks.push(itemSummary(repo, item)))
  selectedTraits.forEach((trait) => chunks.push(traitSummary(trait)))
  augmentIds.slice(0, 2).forEach((augment) => chunks.push(augmentSummary(augment)))
  rankedComps.forEach(({ comp, overlap }) => chunks.push({ ...compSummary(repo, comp), boardOverlap: overlap }))

  const priority = (chunk) => {
    if (analysis.intent === 'comp_search') return chunk.type === 'comp' ? 0 : chunk.type === 'unit' ? 1 : 2
    if (analysis.intent === 'item_build') return chunk.type === 'item' ? 0 : chunk.type === 'unit' ? 1 : 2
    if (analysis.intent === 'trait') return chunk.type === 'trait' ? 0 : 1
    if (analysis.intent === 'augment') return chunk.type === 'augment' ? 0 : 1
    if (analysis.intent === 'economy') return chunk.type === 'comp' ? 0 : 1
    return chunk.type === 'unit' ? 0 : 1
  }

  return {
    source: 'local-json-rag',
    intent: analysis.intent,
    matched: {
      units: units.slice(0, 3).map((u) => u.name),
      items: itemIds.slice(0, 3).map((i) => i.name),
      traits: traitIds.slice(0, 2).map((t) => t.name),
      augments: augmentIds.slice(0, 2).map((a) => a.name),
    },
    chunks: unique(chunks).sort((a, b) => priority(a) - priority(b)).slice(0, maxChunks),
    dataSummary: repo.getDataSummary(),
  }
}

export function buildContextText(context, maxChars = 7000) {
  if (!context) return ''
  const raw = JSON.stringify(context)
  return raw.length <= maxChars ? raw : `${raw.slice(0, maxChars)}...[context truncated]`
}

export function retrieveForQuery(data, message, history = []) {
  const analysis = analyzeQuery(data, message, history)
  return { analysis, context: retrieveContext(data, analysis) }
}
