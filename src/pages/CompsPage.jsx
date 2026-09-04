import { useMemo, useState } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import SearchBar from '../components/common/SearchBar'
import CompRow from '../components/comps/CompRow'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'
import { getCompIdentity, recentPlaceChange } from '../utils/compNaming'

export default function CompsPage() {
  const { data, error } = useTftData()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('avg')
  const [trait, setTrait] = useState('all')
  const [carry, setCarry] = useState('all')
  const [leveling, setLeveling] = useState('all')
  const repo = useMemo(() => data ? createTftRepository(data) : null, [data])
  const all = useMemo(() => repo?.getComps() || [], [repo])
  const meta = useMemo(() => all.map((comp) => ({ comp, identity: getCompIdentity(comp, repo) })), [all, repo])
  const options = useMemo(() => {
    const traits = new Map(); const carries = new Map(); const levels = new Set()
    meta.forEach(({ comp, identity }) => {
      identity.traits.forEach((t) => traits.set(t.apiName, t.name))
      if (identity.carry) carries.set(identity.carry.apiName, identity.carry.name)
      if (identity.style) levels.add(identity.style)
      else if (comp.levelling) levels.add(comp.levelling)
    })
    return { traits: [...traits.entries()].sort((a, b) => a[1].localeCompare(b[1])), carries: [...carries.entries()].sort((a, b) => a[1].localeCompare(b[1])), levels: [...levels].sort() }
  }, [meta])
  const comps = useMemo(() => meta.filter(({ comp, identity }) => {
    const needle = query.trim().toLowerCase()
    return (!needle || identity.searchable.toLowerCase().includes(needle))
      && (trait === 'all' || identity.traits.some((t) => t.apiName === trait))
      && (carry === 'all' || identity.carry?.apiName === carry)
      && (leveling === 'all' || identity.style === leveling)
  }).sort((a, b) => {
    if (sort === 'games') return (b.comp.overall?.count ?? 0) - (a.comp.overall?.count ?? 0)
    if (sort === 'estimated') return (b.comp.trends?.at(-1)?.pick ?? 0) - (a.comp.trends?.at(-1)?.pick ?? 0)
    if (sort === 'change') return (recentPlaceChange(a.comp) ?? 0) - (recentPlaceChange(b.comp) ?? 0)
    return (a.comp.overall?.avg ?? 99) - (b.comp.overall?.avg ?? 99)
  }).map(({ comp }) => comp), [meta, query, trait, carry, leveling, sort])
  if (error) return <ErrorState />
  if (!data) return <Loading />
  return <>
    <section className="page-head"><div><div className="eyebrow">SET 18</div><h1>Comps</h1><p>Find a board by carry, trait or playstyle. Open a comp to see the champions, core items and the trait breakpoints it reaches.</p></div></section>
    <div className="toolbar smart-toolbar">
      <SearchBar value={query} onChange={setQuery} placeholder="Search carry, frontline, trait, item or style..." />
      <select value={trait} onChange={(e) => setTrait(e.target.value)}><option value="all">All traits</option>{options.traits.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select value={carry} onChange={(e) => setCarry(e.target.value)}><option value="all">All carries</option>{options.carries.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select value={leveling} onChange={(e) => setLeveling(e.target.value)}><option value="all">All styles</option>{options.levels.map((level) => <option key={level}>{level}</option>)}</select>
      <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="avg">Best average place</option><option value="change">Recent Place Change</option><option value="estimated">Highest estimated pick</option><option value="games">Most Games</option></select>
    </div>
    <div className="comp-list">{comps.map((c) => <CompRow key={c.Cluster} comp={c} repo={repo} />)}</div>
  </>
}
