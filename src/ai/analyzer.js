import Fuse from 'fuse.js'
import { createTftRepository } from '../services/tftRepository'
import { normalizeText, tokenize } from './text'

const GREETING_RE = /^(xin chao|hello|helo|hi|hey|chao|cam on|thank you|thanks|yo|alo)[!.? ]*$/

const INTENT_RULES = [
  { id: 'comp_search', keys: ['doi hinh', 'comp', 'board', 'xoay bai', 'pivot', 'choi bai', 'bai nao', 'goi y bai', 'khong biet choi gi', 'không biết chơi gì'] },
  { id: 'item_build', keys: ['item', 'trang bi', 'do cho', 'ghep do', 'do nao', 'bis', 'holder', 'cam gi', 'cầm gì'] },
  { id: 'trait', keys: ['toc', 'he', 'trait', 'moc', 'kich moc'] },
  { id: 'augment', keys: ['augment', 'nang cap', 'goi y nang cap'] },
  { id: 'economy', keys: ['roll', 'reroll', 'level', 'len cap', 'up cap', 'eco', 'kinh te', 'chuoi thang', 'chuoi thua', 'slow roll', 'fast 8'] },
  { id: 'unit_build', keys: ['carry', 'build', 'danh gia', 'nen danh', 'tuong nao', 'co nen', 'frontline', 'tank'] },
  { id: 'recommendation', keys: ['goi y', 'gợi ý', 'nen choi', 'nên chơi', 'muon choi', 'muốn chơi', 'chua biet', 'chưa biết'] },
]

const ALIASES = new Map([
  ['ahry', 'ahri'], ['ahrii', 'ahri'], ['ari', 'ahri'], ['a hri', 'ahri'],
  ['xayahh', 'xayah'], ['camli', 'camille'], ['camile', 'camille'], ['florra', 'fiora'],
  ['sylass', 'sylas'], ['sôjin', 'shojin'], ['sojin', 'shojin'], ['shojin', 'shojin'],
  ['vo cuc', 'vo cuc'], ['vô cực', 'vo cuc'], ['gnh', 'gang'], ['gang bao thach', 'gang'],
])

const ANALYZER_CACHE = new WeakMap()

function buildFuse(items, keys) {
  return new Fuse(items, {
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys,
  })
}

function getIndexes(data) {
  if (ANALYZER_CACHE.has(data)) return ANALYZER_CACHE.get(data)
  const repo = createTftRepository(data)
  const indexes = {
    repo,
    units: buildFuse(repo.getUnits(), [
      { name: 'name', weight: 0.55 }, { name: 'en_name', weight: 0.2 },
      { name: 'apiName', weight: 0.15 }, { name: 'characterName', weight: 0.1 },
    ]),
    items: buildFuse(repo.getItems(), [
      { name: 'name', weight: 0.55 }, { name: 'en_name', weight: 0.2 }, { name: 'apiName', weight: 0.25 },
    ]),
    traits: buildFuse(repo.getTraits(), [
      { name: 'name', weight: 0.6 }, { name: 'en_name', weight: 0.2 }, { name: 'apiName', weight: 0.2 },
    ]),
    augments: buildFuse(repo.getAugments(), [
      { name: 'name', weight: 0.65 }, { name: 'apiName', weight: 0.2 }, { name: 'desc', weight: 0.15 },
    ]),
  }
  ANALYZER_CACHE.set(data, indexes)
  return indexes
}

function searchEntity(fuse, rawText, limit) {
  const normalized = normalizeText(rawText)
  const terms = [...new Set([normalized, ...tokenize(normalized)])].filter((x) => x.length >= 2)
  const hits = []
  for (const term of terms) {
    const alias = ALIASES.get(term) || term
    for (const hit of fuse.search(alias).slice(0, limit)) {
      if ((hit.score ?? 1) <= 0.44) hits.push({ value: hit.item, score: hit.score ?? 1 })
    }
  }
  const merged = new Map()
  for (const hit of hits) {
    const id = hit.value.apiName || hit.value.id || hit.value.name
    const previous = merged.get(id)
    if (!previous || hit.score < previous.score) merged.set(id, hit)
  }
  return [...merged.values()].sort((a, b) => a.score - b.score).slice(0, limit)
}

function intentFromQuery(text) {
  const normalized = normalizeText(text)
  if (GREETING_RE.test(normalized)) return 'greeting'
  for (const rule of INTENT_RULES) if (rule.keys.some((key) => normalized.includes(normalizeText(key)))) return rule.id
  return 'general'
}

export function analyzeQuery(data, message, history = []) {
  if (!data) return { intent: 'general', normalized: normalizeText(message), query: message, entities: {} }
  const { repo, units, items, traits, augments } = getIndexes(data)
  const recentUserText = Array.isArray(history)
    ? history.filter((m) => m?.role === 'user').slice(-2).map((m) => String(m.content || '')).join(' ')
    : ''
  const expanded = `${recentUserText} ${message}`.trim()
  const intent = intentFromQuery(message)
  const found = {
    units: searchEntity(units, expanded, 5),
    items: searchEntity(items, expanded, 4),
    traits: searchEntity(traits, expanded, 3),
    augments: searchEntity(augments, expanded, 3),
  }
  const normalized = normalizeText(message)
  // Với câu không có từ khóa intent: chỉ tin rằng "đang hỏi TFT" khi tên một thực thể
  // xuất hiện nguyên vẹn trong câu hỏi — tránh fuzzy match rác cho câu ngoài game.
  const namesEntity = (list) => list.some(({ value }) => {
    const name = normalizeText(value.name)
    return name.length >= 3 && normalized.includes(name)
  })
  const mentionsTft = intent !== 'general'
    || namesEntity(found.units) || namesEntity(found.items) || namesEntity(found.traits) || namesEntity(found.augments)
    || /tft|set 18|dtcl|dau truong chan ly/.test(normalized)

  return {
    intent: mentionsTft ? intent : 'general',
    mentionsTft,
    normalized,
    query: message,
    entities: {
      units: found.units.map((x) => ({ name: x.value.name, apiName: x.value.apiName, score: x.score })),
      items: found.items.map((x) => ({ name: x.value.name, apiName: x.value.apiName, score: x.score })),
      traits: found.traits.map((x) => ({ name: x.value.name, apiName: x.value.apiName, score: x.score })),
      augments: found.augments.map((x) => ({ name: x.value.name, apiName: x.value.apiName, score: x.score })),
    },
  }
}

export function resolveUnitNames(repo, analysis) {
  return (analysis?.entities?.units || []).map((x) => repo.getUnit(x.apiName) || repo.getUnit(x.name)).filter(Boolean)
}
