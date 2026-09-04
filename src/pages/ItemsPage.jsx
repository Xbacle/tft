import { useMemo, useState } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import { isRadiantItem } from '../services/assetRepository'
import { getItemKind, itemKindLabel } from '../utils/itemType'
import SearchBar from '../components/common/SearchBar'
import ItemCard from '../components/items/ItemCard'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'

export default function ItemsPage() {
  const { data, error } = useTftData()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [trait, setTrait] = useState('all')
  const [sort, setSort] = useState('name')
  const repo = useMemo(() => data ? createTftRepository(data) : null, [data])
  const all = repo?.getItems() || []

  const traitOptions = useMemo(() => {
    const map = new Map()
    all.forEach((item) => (item.associatedTraits || []).forEach((id) => map.set(id, repo.getTrait(id)?.name || id)))
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [all, repo])

  const items = useMemo(() => all.filter((item) => {
    const needle = q.trim().toLowerCase()
    const haystack = `${item.name || ''} ${item.en_name || ''} ${item.desc || ''} ${(item.itemTags || []).join(' ')} ${(item.tags || []).join(' ')}`.toLowerCase()
    return (!needle || haystack.includes(needle))
      && (kind === 'all' || getItemKind(item) === kind)
      && (trait === 'all' || (item.associatedTraits || []).includes(trait))
  }).sort((a, b) => {
    if (sort === 'kind') return itemKindLabel(getItemKind(a)).localeCompare(itemKindLabel(getItemKind(b))) || a.name.localeCompare(b.name)
    if (sort === 'radiant') return Number(isRadiantItem(b)) - Number(isRadiantItem(a)) || a.name.localeCompare(b.name)
    return (a.name || '').localeCompare(b.name || '')
  }), [all, q, kind, trait, sort])

  if (error) return <ErrorState />
  if (!data) return <Loading />
  return <>
    <section className="page-head"><div><div className="eyebrow">SET 18</div><h1>Items</h1><p>Find an item by name or effect, then check its recipe, special type, useful champions and related boards.</p></div></section>
    <div className="toolbar smart-toolbar">
      <SearchBar value={q} onChange={setQ} placeholder="Search item or effect" />
      <select value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All item types</option><option value="normal">Normal</option><option value="artifact">Artifact</option><option value="radiant">Radiant</option><option value="traits">Traits</option><option value="other">Other</option></select>
      <select value={trait} onChange={(e) => setTrait(e.target.value)}><option value="all">All associated traits</option>{traitOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="name">Name</option><option value="kind">Type</option><option value="radiant">Radiant first</option></select>
    </div>
    <div className="entity-grid">{items.map((item) => <ItemCard key={item.apiName || item.id} item={item} />)}</div>
  </>
}
