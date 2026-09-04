export function getItemKind(item) {
  const tags = new Set([...(item?.itemTags || []), ...(item?.tags || [])].map((tag) => String(tag)))
  const has = (needle) => [...tags].some((tag) => tag.toLowerCase().includes(needle.toLowerCase()))

  if (has('radiant')) return 'radiant'
  if (has('artifact')) return 'artifact'
  if ((item?.associatedTraits || []).length > 0 || has('emblem')) return 'traits'
  if (has('craftable') || has('component')) return 'normal'
  return 'other'
}

export function itemKindLabel(kind) {
  return {
    normal: 'Normal',
    artifact: 'Artifact',
    radiant: 'Radiant',
    traits: 'Traits',
    other: 'Other',
  }[kind] || 'Other'
}
