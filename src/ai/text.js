export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function tokenize(value) {
  return normalizeText(value).split(/\s+/).filter((x) => x.length >= 2)
}

export function compactId(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function clampText(value, max = 900) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}
