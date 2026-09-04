export function includesQuery(value, query) {
  if (!query) return true
  return String(value ?? '').toLowerCase().includes(query.toLowerCase())
}

export function filterByText(items, query, fields) {
  if (!query) return items
  const q = query.toLowerCase()
  return items.filter((item) => fields.some((field) => String(field(item) ?? '').toLowerCase().includes(q)))
}
