import { useMemo, useState } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import SearchBar from '../components/common/SearchBar'
import UnitCard from '../components/units/UnitCard'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'
import { roleLabel } from '../utils/labels'
import { getUnitRoleTags, roleFamilyLabel, roleMatches } from '../utils/role'

export default function UnitsPage() {
  const { data, error } = useTftData()
  const [q, setQ] = useState('')
  const [cost, setCost] = useState('all')
  const [trait, setTrait] = useState('all')
  const [role, setRole] = useState('all')
  const [roleTag, setRoleTag] = useState('all')
  const [sort, setSort] = useState('cost')
  const repo = useMemo(() => data ? createTftRepository(data) : null, [data])
  const units = repo?.getUnits() || []
  const roleData = repo?.getRoleData() || {}

  const options = useMemo(() => {
    const traits = new Map(); const roles = new Map(); const roleFamilies = new Map(); const costs = new Set()
    units.forEach((u) => {
      if (Number.isFinite(u.cost)) costs.add(u.cost)
      ;(u.traitApiNames || []).forEach((id, i) => traits.set(id, u.traits?.[i] || repo.getTrait(id)?.name || id))
      if (u.role) roles.set(u.role, roleLabel(u.role, roleData))
      getUnitRoleTags(u, roleData).forEach((tag) => roleFamilies.set(tag, tag))
    })
    return {
      costs: [...costs].sort((a, b) => a - b),
      traits: [...traits.entries()].sort((a, b) => a[1].localeCompare(b[1])),
      roles: [...roles.entries()].sort((a, b) => a[1].localeCompare(b[1])),
      roleTags: [...roleFamilies.keys()].sort((a, b) => a.localeCompare(b)),
    }
  }, [units, roleData, repo])

  const filtered = useMemo(() => units.filter((u) => {
    const needle = q.trim().toLowerCase()
    const unitTraits = [...(u.traits || []), ...(u.traitApiNames || []).map((id) => repo.getTrait(id)?.name || '')]
    const roleName = roleLabel(u.role, roleData)
    const families = getUnitRoleTags(u, roleData)
    const text = `${u.name || ''} ${u.en_name || ''} ${unitTraits.join(' ')} ${roleName} ${families.join(' ')}`.toLowerCase()
    return (!needle || text.includes(needle))
      && (cost === 'all' || String(u.cost) === cost)
      && (trait === 'all' || (u.traitApiNames || []).includes(trait))
      && roleMatches(u, role, roleData)
      && (roleTag === 'all' || families.includes(roleFamilyLabel(roleTag)))
  }).sort((a, b) => {
    if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sort === 'hp') return (b.stats?.hp ?? 0) - (a.stats?.hp ?? 0)
    return (a.cost ?? 99) - (b.cost ?? 99) || (a.name || '').localeCompare(b.name || '')
  }), [units, q, cost, trait, role, roleTag, sort, roleData, repo])

  if (error) return <ErrorState />
  if (!data) return <Loading />
  return <>
    <section className="page-head"><div><div className="eyebrow">SET 18</div><h1>Champions</h1><p>Browse the shop champions in Set 18. Open any champion to see the skill, full stats, item usage and boards where they appear.</p></div></section>
    <div className="toolbar smart-toolbar">
      <SearchBar value={q} onChange={setQ} placeholder="Search champion, trait or role" />
      <select value={cost} onChange={(e) => setCost(e.target.value)}><option value="all">All costs</option>{options.costs.map((c) => <option key={c} value={c}>{c}-cost</option>)}</select>
      <select value={trait} onChange={(e) => setTrait(e.target.value)}><option value="all">All traits</option>{options.traits.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select value={roleTag} onChange={(e) => setRoleTag(e.target.value)}><option value="all">Any playstyle</option>{options.roleTags.map((name) => <option key={name} value={name}>{name}</option>)}</select>
      <select value={role} onChange={(e) => setRole(e.target.value)}><option value="all">Any exact role</option>{options.roles.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="cost">Cost</option><option value="name">Name</option><option value="hp">Health</option></select>
    </div>
    <div className="entity-grid">{filtered.map((u) => <UnitCard key={u.apiName} unit={u} imageType="splash" />)}</div>
  </>
}
