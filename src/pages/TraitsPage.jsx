import { useMemo, useState } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import SearchBar from '../components/common/SearchBar'
import TraitCard from '../components/traits/TraitCard'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'

export default function TraitsPage() {
  const { data, error } = useTftData(); const [q,setQ]=useState(''); const [type,setType]=useState('all'); const [sort,setSort]=useState('units'); const [cost,setCost]=useState('all')
  const repo=useMemo(()=>data?createTftRepository(data):null,[data]); const all=repo?.getTraits()||[]
  const traits=useMemo(()=>all.filter(t=>{const needle=q.trim().toLowerCase(); const hay=`${t.name||''} ${t.en_name||''} ${t.apiName||''} ${t.desc||''} ${(t.effects||[]).map(e=>e.desc||'').join(' ')}`.toLowerCase(); const unitsForTrait=repo.getRelatedUnitsForTrait(t); const costMatch=cost==='all'||unitsForTrait.some(u=>String(u.cost)===cost); return (!needle||hay.includes(needle))&&(type==='all'||t.type===type)&&costMatch}).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):((repo.getRelatedUnitsForTrait(b).length)-(repo.getRelatedUnitsForTrait(a).length))),[all,q,type,sort,cost,repo])
  if(error)return <ErrorState/>; if(!data)return <Loading/>
  return <><section className="page-head"><div><div className="eyebrow">SET 18</div><h1>Traits</h1><p>See what each trait does, which champions activate it, and the exact thresholds available in Set 18.</p></div></section><div className="toolbar smart-toolbar"><SearchBar value={q} onChange={setQ} placeholder="Search trait, champion or effect"/><select value={type} onChange={e=>setType(e.target.value)}><option value="all">All types</option><option value="origin">Origin</option><option value="class">Class</option><option value="unique">Unique</option></select><select value={cost} onChange={e=>setCost(e.target.value)}><option value="all">Any champion cost</option>{[1,2,3,4,5].map(c=><option key={c} value={c}>{c}-cost</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="units">Most champions</option><option value="name">Name</option></select></div><div className="entity-grid">{traits.map(t=><TraitCard key={t.apiName} trait={t} unitCount={repo.getRelatedUnitsForTrait(t).length}/>)}</div></>
}
