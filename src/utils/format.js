export function valueOrNA(value) {
  return value === undefined || value === null || value === '' ? 'N/A' : value
}

export function percent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'N/A'
  return `${(Number(value) * 100).toFixed(2)}%`
}

export function number(value, digits = 2) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'N/A'
  return Number(value).toFixed(digits)
}

export function shortId(id) {
  const text = valueOrNA(id)
  return String(text).replace(/^DA_18_/, '').replace(/^TFT18_/, '').replace(/^TFT_Item_/, '').replace(/^DA_/, '')
}

export function safeText(value) {
  return typeof value === 'string' ? value.replace(/<[^>]+>/g, '').replace(/\r?\n/g, ' ') : value
}
