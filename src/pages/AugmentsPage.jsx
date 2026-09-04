import { useMemo, useState } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import SearchBar from '../components/common/SearchBar'
import AugmentCard from '../components/augments/AugmentCard'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'
import { rarityRank } from '../utils/labels'

export default function AugmentsPage() {
  const { data, error } = useTftData(); const [q,setQ]=useState(''); const [rarity,setRarity]=useState('all'); const [round,setRound]=useState('all'); const [type,setType]=useState('all'); const [sort,setSort]=useState('rarity')
  const repo=useMemo(()=>data?createTftRepository(data):null,[data]); const all=repo?.getAugments()||[]
  const rounds=useMemo(()=>[...new Set(all.flatMap(a=>a.rounds||[]))].sort(),[all]); const types=useMemo(()=>[...new Set(all.map(a=>a.type).filter(Boolean))].sort(),[all])
  const augments=useMemo(()=>all.filter(a=>{const needle=q.trim().toLowerCase(); return (!needle||`${a.name} ${a.apiName} ${a.desc||''} ${(a.tags||[]).join(' ')} ${(a.manual_tags||[]).join(' ')}`.toLowerCase().includes(needle))&&(rarity==='all'||a.rarity===rarity)&&(round==='all'||(a.rounds||[]).includes(round))&&(type==='all'||a.type===type)}).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='rarity'?(rarityRank(b.rarity)-rarityRank(a.rarity)):(a.name.localeCompare(b.name))),[all,q,rarity,round,type,sort])
  if(error)return <ErrorState/>; if(!data)return <Loading/>
  return <><section className="page-head"><div><div className="eyebrow">SET 18</div><h1>Augments</h1><p>Every augment in Set 18 — filter by tier, round and effect.</p></div></section><div className="toolbar smart-toolbar"><SearchBar value={q} onChange={setQ} placeholder="Search augment, effect or tag"/><select value={rarity} onChange={e=>setRarity(e.target.value)}><option value="all">All tiers</option><option>Silver</option><option>Gold</option><option>Prismatic</option></select><select value={round} onChange={e=>setRound(e.target.value)}><option value="all">Any round</option>{rounds.map(r=><option key={r}>{r}</option>)}</select><select value={type} onChange={e=>setType(e.target.value)}><option value="all">All types</option>{types.map(t=><option key={t}>{t}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="rarity">Tier</option><option value="name">Name</option></select></div><div className="entity-grid">{augments.map(a=><AugmentCard key={a.apiName||a.id} augment={a}/>)}</div></>
}
