import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import { resolveTftDescription, extractTftValues } from '../utils/tftText'
import TftValues from '../components/common/TftValues'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'
import InfoImage from '../components/common/InfoImage'
import { percent } from '../utils/format'

function topicHeading(slug) {
  return {
    shop: ['Shop Odds & Pool Sizes', 'Roll chances per level and how many copies of each champion are in the pool.'],
    augments: ['Augment Distributions', 'How augments are spread across tiers, rounds and effects.'],
    encounters: ['Opening Encounters', 'Encounter text available in the Set 18 source.'],
    loot: ['Rounds, Stage Loot & Orbs', 'A compact view of loot structures that are directly identifiable in the source.'],
    wisps: ['Wisps', 'Source-grounded values for the Set 18 mechanic records that are useful to players.'],
    draven: ['Draven Bounties', 'Bounty thresholds and rewards exposed in Bounty Seeker.'],
    coven: ['Coven Cashouts', 'Point and gold values exposed by the Coven prop data.'],
    thiefs: ["Thief's Gloves", "The item's description, stat line and available source curves."],
    'golden-egg': ['Golden Egg', 'The Golden Egg timing values exposed by the augment source.'],
    booster: ['Booster Pack', 'Booster Pack timing and numerical values available in the source.'],
  }[slug] || ['Reference', 'This topic is not available.']
}

export default function InfoTopicPage() {
  const { slug } = useParams(); const { data, error } = useTftData(); const repo = useMemo(() => data ? createTftRepository(data) : null, [data])
  if (error) return <ErrorState />; if (!repo) return <Loading />
  const source = repo.getSetData(); const [title, intro] = topicHeading(slug); const assets = data.assets || {}
  const note = <div className="soft-panel"><p>All numbers on this page come straight from the current Set 18 patch.</p></div>
  let body = null
  if (slug === 'shop') {
    const units = repo.getUnits(); const rows = [1,2,3,4,5].map((cost) => { const list = units.filter((u) => u.cost === cost); const pool = [...new Set(list.map((u) => u.poolCount).filter((v) => v != null))]; return { cost, champions: list.length, pool: pool.join(' / ') || 'N/A', total: list.reduce((s,u)=>s+(u.poolCount||0),0) } })
    body = <><div className="stat-table">{rows.map((r) => <div key={r.cost}><span>{r.cost}-cost champions</span><b>{r.champions} · {r.pool} copies each · {r.total} total</b></div>)}</div><p className="mt-4 text-sm text-slate-500">The source contains pool sizes, but not a complete player-level shop roll-odds table. That percentage is therefore intentionally not estimated here.</p></>
  } else if (slug === 'augments') {
    const augments = repo.getAugments(); const rows=['Silver','Gold','Prismatic'].map(r=>({rarity:r,count:augments.filter(a=>a.rarity===r).length})); const rounds=[...new Set(augments.flatMap(a=>a.rounds||[]))].sort(); const types=[...new Set(augments.map(a=>a.type).filter(Boolean))].sort()
    body=<><div className="info-kpi-grid">{rows.map(r=><div className="info-kpi" key={r.rarity}><span>{r.rarity}</span><b>{r.count}</b><small>{percent(augments.length ? r.count/augments.length : 0)} of all augments</small></div>)}</div><div className="mt-6"><h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">Rounds represented</h3><div className="chip-row">{rounds.map(r=><span className="tier-pill" key={r}>{r}</span>)}</div></div><div className="mt-6"><h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">Types represented</h3><div className="chip-row">{types.map(t=><span className="tier-pill" key={t}>{t}</span>)}</div></div></>
  } else if (slug === 'encounters') {
    body=<div className="info-list">{(source.encounters||[]).filter(x=>x.name||x.desc).map(e=><div key={e.apiName}><b>{e.name||e.en_name||'Encounter'}</b><p>{resolveTftDescription(e,e.desc)}</p>{e.postSpawnDesc&&<p className="mt-2 text-slate-500">{resolveTftDescription(e,e.postSpawnDesc)}</p>}</div>)}</div>
  } else if (slug === 'loot') {
    body=<><div className="stat-table"><div><span>Loot definitions</span><b>{source.extras?.loot?.length||0}</b></div><div><span>Armory keys</span><b>{source.armory_items?.length||0}</b></div><div><span>Payload definitions</span><b>{source.extras?.payloads?.length||0}</b></div><div><span>Charm records</span><b>{source.charms?.length||0}</b></div></div>{source.armory_items?.length>0&&<div className="mt-6 info-list">{source.armory_items.map(x=><div key={x.apiName}><b>{x.name||x.en_name||'Armory key'}</b><p>{resolveTftDescription(x,x.desc)}</p></div>)}</div>}</>
  } else if (slug === 'wisps') {
    const trait=repo.getTrait('DA_18_Blossom'); body=<><div className="soft-panel"><p>{resolveTftDescription(trait,trait?.desc)}</p></div><TftValues values={extractTftValues(trait,trait?.desc)} title="Values referenced by the Blossom trait"/><TftValues values={Object.entries(trait?.curveTable||{}).map(([key,v])=>({key,label:key.replace(/([a-z])([A-Z])/g,'$1 $2'),values:(v||[]).map(([level,value])=>({level,value:String(value)}))}))} title="Available Blossom curve values"/></>
  } else if (slug === 'draven') {
    const trait=repo.getTrait('DA_DravenUniqueTrait18'); body=<><div className="soft-panel"><p>{resolveTftDescription(trait,trait?.desc)}</p></div><TftValues values={extractTftValues(trait,trait?.desc)} title="Values referenced in the trait text"/><TftValues values={Object.entries(trait?.curveTable||{}).map(([key,v])=>({key,label:key.replace(/([a-z])([A-Z])/g,'$1 $2'),values:(v||[]).map(([level,value])=>({level,value:String(value)}))}))} title="Bounty thresholds and rewards"/><InfoImage src="/assets/info/draven-bounties/draven-bounties.png" /></>
  } else if (slug === 'coven') {
    const prop=source.extras?.props?.[0]; body=<><div className="stat-table"><div><span>Mechanic</span><b>{prop?.name||'Coven Gloombriar'}</b></div><div><span>Point ladder</span><b>{prop?.curveTable?.ArmoryToPoint?.map(x=>x[1]).join(' · ')||'N/A'}</b></div><div><span>Gold ladder</span><b>{prop?.curveTable?.GoldValues_PleaseRememberToStillUpdateCashoutDAs?.map(x=>`${x[0]}:${x[1]}g`).join(' · ')||'N/A'}</b></div></div><TftValues values={Object.entries(prop?.curveTable||{}).map(([key,v])=>({key,label:key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' '),values:(v||[]).map(([level,value])=>({level,value:String(value)}))}))} title="Coven curve values"/><InfoImage src="/assets/info/coven-cashouts/coven-cashouts.png" /></>
  } else if (slug === 'thiefs') {
    const item=repo.getItem('DA_ThiefsGloves'); body=<><div className="soft-panel"><p>{resolveTftDescription(item,item?.desc)}</p></div>{item?.statLine&&<div className="mt-4 soft-panel"><b className="text-slate-100">Stat line</b><p className="mt-2 text-sm text-slate-300">{resolveTftDescription(item,item.statLine)}</p></div>}<TftValues values={extractTftValues(item,item?.desc)} title="Values referenced by the item"/><TftValues values={Object.entries(item?.curveTable||{}).map(([key,v])=>({key,label:key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' '),values:(v||[]).map(([level,value])=>({level,value:String(value)}))}))} title="Available item curves"/><InfoImage src="/assets/info/thiefs-gloves/thiefs-gloves.png" /></>
  } else if (slug === 'golden-egg') {
    const a=repo.getAugment('DA_GoldenEgg'); body=<><div className="soft-panel"><p>{resolveTftDescription(a,a?.desc)}</p></div><TftValues values={extractTftValues(a,a?.desc)} title="Golden Egg timing"/><Link className="inline-flex rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200" to={`/augments/${a?.apiName}`}>Open Golden Egg detail</Link><InfoImage src="/assets/info/golden-egg/golden-egg.png" /></>
  } else if (slug === 'booster') {
    const a=repo.getAugment('DA_BoosterPack'); body=<><div className="soft-panel"><p>{resolveTftDescription(a,a?.desc)}</p></div><TftValues values={extractTftValues(a,a?.desc)} title="Booster Pack values"/><TftValues values={Object.entries(a?.curveTable||{}).map(([key,v])=>({key,label:key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' '),values:(v||[]).map(([level,value])=>({level,value:String(value)}))}))} title="Available Booster Pack curves"/><Link className="inline-flex rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200" to={`/augments/${a?.apiName}`}>Open Booster Pack detail</Link><InfoImage src="/assets/info/booster-pack/booster-pack.png" /></>
  }
  return <><section className="page-head"><Link to="/info" className="inline-flex text-xs font-bold text-indigo-300 hover:text-indigo-200">← All reference topics</Link><div className="mt-4"><div className="eyebrow">REFERENCE</div><h1>{title}</h1><p>{intro}</p></div></section><section className="info-article">{note}{body}</section></>
}
