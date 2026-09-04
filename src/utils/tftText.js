const TOKEN_RE = /<TFTCurveTable\s+([^>]*?)\s*\/?>|<TFTAttribute\s+([^>]*?)\s*\/?>/gi
const ATTR_RE = /([A-Za-z][\w-]*)="([^"]*)"/g

function parseAttrs(input = '') {
  const attrs = {}
  let match
  while ((match = ATTR_RE.exec(input))) attrs[match[1]] = match[2]
  return attrs
}

function prettifyKey(value = '') {
  return String(value)
    .replace(/^TFTCalculationAttributes\./, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\bTft\b/g, 'TFT')
    .replace(/\bAp\b/g, 'AP')
    .replace(/\bAd\b/g, 'AD')
    .replace(/\bMr\b/g, 'MR')
    .replace(/\bHp\b/g, 'HP')
    .replace(/\bAs\b/g, 'AS')
    .replace(/\bMs\b/g, 'MS')
    .replace(/\bCrit\b/g, 'Crit')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeNumber(value) {
  if (typeof value !== 'number') return value
  if (Number.isInteger(value)) return String(value)
  return Number(value.toFixed(3)).toString()
}

export function formatTftValue(value, format = '') {
  if (value === null || value === undefined) return 'N/A'
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  switch (String(format).toLowerCase()) {
    case 'percent':
      return `${normalizeNumber(numeric * 100)}%`
    case 'percentminusone':
    case 'percentMinusOne':
      return `${normalizeNumber((numeric - 1) * 100)}%`
    case 'invertedpercent':
    case 'invertedPercent':
      return `${normalizeNumber((1 - numeric) * 100)}%`
    default:
      return normalizeNumber(numeric)
  }
}

function getValueRows(source, row) {
  if (!source || !row) return []
  const curveValues = source.curveValues?.[row]
  const curveTable = source.curveTable?.[row]
  const values = Array.isArray(curveValues) && curveValues.length ? curveValues : curveTable
  if (!Array.isArray(values)) return []
  return values
    .filter((entry) => Array.isArray(entry) && entry.length >= 2)
    .map(([level, value]) => ({ level, value }))
}

function selectCurveColumn(rows, column) {
  if (column === undefined || column === null || column === '') return rows
  const numericColumn = Number(column)
  if (!Number.isFinite(numericColumn)) return rows
  const exact = rows.find((row) => Number(row.level) === numericColumn)
  if (exact) return [exact]
  const lowerOrEqual = rows.filter((row) => Number(row.level) <= numericColumn).sort((a, b) => Number(b.level) - Number(a.level))[0]
  if (lowerOrEqual) return [lowerOrEqual]
  const byIndex = rows[Math.max(0, Math.min(rows.length - 1, numericColumn - 1))]
  return byIndex ? [byIndex] : rows.slice(-1)
}

function uniqueRows(rows) {
  const seen = new Set()
  return rows.filter((row) => {
    const key = JSON.stringify([row.level, row.value])
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function resolveAttributeValues(source, attributeId) {
  if (!attributeId) return []
  const fromEntity = source?.attributeValues?.[attributeId]
  if (Array.isArray(fromEntity) && fromEntity.length) {
    return uniqueRows(fromEntity.map((value, index) => ({ level: index + 1, value })))
  }
  const calc = source?.attributeCalcs?.[attributeId]
  if (Array.isArray(calc?.values) && calc.values.length) {
    return uniqueRows(calc.values.map((value, index) => ({ level: index + 1, value })))
  }
  return []
}

function flattenTokens(source, text) {
  return String(text || '')
    .replace(TOKEN_RE, (_full, curveAttrs, attributeAttrs) => {
      if (curveAttrs !== undefined) {
        const attrs = parseAttrs(curveAttrs)
        const rows = selectCurveColumn(uniqueRows(getValueRows(source, attrs.row)), attrs.column)
        if (!rows.length) return 'N/A'
        return rows.map(({ value }) => formatTftValue(value, attrs.format)).join(' / ')
      }
      const attrs = parseAttrs(attributeAttrs)
      const rows = resolveAttributeValues(source, attrs.attributeID || attrs.attributeId)
      if (!rows.length) return 'N/A'
      return rows.map(({ value }) => formatTftValue(value, '')).join(' / ')
    })
    .replace(/<TFTConditionalStyle[^>]*>/gi, '')
    .replace(/<\/TFTConditionalStyle>/gi, '')
    .replace(/<TFTAttribute[^>]*>/gi, '')
    .replace(/<TFTCurveTable[^>]*>/gi, '')
    .replace(/<Rules>.*?<\/Rules>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s*\r?\n\s*/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function resolveTftDescription(source, text) {
  return text ? flattenTokens(source, text) : 'N/A'
}

function resolveAttributeLabel(source, attributeId) {
  const calc = source?.attributeCalcs?.[attributeId]
  const row = calc?.terms?.find((term) => term?.row)?.row
  return row ? prettifyKey(row) : prettifyKey(attributeId)
}

export function extractTftValues(source, text = '') {
  const results = []
  const seen = new Set()
  let match
  TOKEN_RE.lastIndex = 0
  while ((match = TOKEN_RE.exec(String(text || '')))) {
    if (match[1] !== undefined) {
      const attrs = parseAttrs(match[1])
      const rows = selectCurveColumn(uniqueRows(getValueRows(source, attrs.row)), attrs.column)
      if (!rows.length || seen.has(attrs.row)) continue
      seen.add(attrs.row)
      results.push({
        key: attrs.row,
        label: prettifyKey(attrs.row),
        format: attrs.format || '',
        values: rows.map(({ level, value }) => ({ level, value: formatTftValue(value, attrs.format) })),
      })
      continue
    }

    const attrs = parseAttrs(match[2])
    const attributeId = attrs.attributeID || attrs.attributeId
    const rows = uniqueRows(resolveAttributeValues(source, attributeId))
    if (!rows.length || seen.has(attributeId)) continue
    seen.add(attributeId)
    results.push({
      key: attributeId,
      label: resolveAttributeLabel(source, attributeId),
      format: '',
      values: rows.map(({ level, value }) => ({ level, value: formatTftValue(value, '') })),
    })
  }
  TOKEN_RE.lastIndex = 0
  return results
}

export function resolveUnitAbility(unit) {
  if (!unit?.ability) return { name: 'N/A', description: 'N/A', values: [] }
  const source = {
    ...unit,
    attributeValues: unit.ability.attributeValues || unit.attributeValues,
    attributeCalcs: unit.ability.attributeCalcs || unit.attributeCalcs,
    curveValues: { ...(unit.curveValues || {}), ...(unit.ability.curveValues || {}) },
    curveTable: { ...(unit.curveTable || {}), ...(unit.ability.curveTable || {}) },
  }
  return {
    name: unit.ability.name || 'N/A',
    description: resolveTftDescription(source, unit.ability.desc),
    values: extractTftValues(source, unit.ability.desc),
    variables: unit.ability.variables || [],
  }
}

export function extractAllCurveValues(source) {
  const rows = []
  const table = source?.curveTable || {}
  for (const [key, values] of Object.entries(table)) {
    if (!Array.isArray(values)) continue
    const formatted = uniqueRows(values.map(([level, value]) => ({ level, value }))).map(({ level, value }) => ({ level, value: formatTftValue(value) }))
    if (formatted.length) rows.push({ key, label: prettifyKey(key), values: formatted })
  }
  return rows
}
