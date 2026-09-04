import { Link } from 'react-router-dom'
import ItemIcon from '../items/ItemIcon'
import UnitImage from '../units/UnitImage'
import AssetImage from '../common/AssetImage'
import { createAssetRepository } from '../../services/assetRepository'
import { useTftData } from '../../services/dataLoader'
import { number, percent } from '../../utils/format'
import { getCompIdentity, recentPlaceChange } from '../../utils/compNaming'
import { compPlayerSummary } from '../../utils/playerCopy'

function ActiveTrait({ activation, assets }) {
  const { trait, count, activeThreshold, nextThreshold } = activation
  const progress = nextThreshold ? Math.min(100, Math.round((count / nextThreshold) * 100)) : 100
  return <Link to={`/traits/${encodeURIComponent(trait.apiName)}`} title={`${trait.name}: ${count} champions. Active breakpoint: ${activeThreshold}.`} className="group flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-2.5 py-2 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400/35 hover:bg-indigo-950/15">
    <AssetImage src={assets.getTraitIcon(trait)} alt={trait.name} label={trait.name} fallbackSize="sm" className="h-6 w-6 shrink-0 object-contain" />
    <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-200">{trait.name}</span>
    <span className="shrink-0 rounded-md bg-indigo-400/10 px-1.5 py-0.5 text-[10px] font-black text-indigo-100">{activeThreshold}</span>
    <span className="hidden text-[9px] text-slate-500 sm:inline">{count}/{nextThreshold || count}</span>
    <span className="absolute" style={{ width: 0, height: 0 }} />
    <span className="sr-only">Breakpoint progress {progress}%</span>
  </Link>
}

export default function CompRow({ comp, repo }) {
  const { data } = useTftData(); const assets = createAssetRepository(data?.assets || {})
  const identity = getCompIdentity(comp, repo); const activations = repo.getCompTraitActivations(comp).filter((e) => e.isActive); const items = repo.getCompItems(comp).slice(0, 3); const change = recentPlaceChange(comp)
  return <Link className="group grid gap-4 rounded-2xl border border-white/[0.07] bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-950/95 p-4 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-0.5 hover:border-indigo-400/30 hover:shadow-xl hover:shadow-indigo-950/20 lg:grid-cols-[minmax(0,1fr)_190px_150px]" to={`/comps/${comp.Cluster}`}>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-black tracking-tight text-white">{identity.title}</h3><span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{identity.style}</span></div>
      <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{compPlayerSummary(identity, comp)}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{activations.slice(0, 6).map((a) => <ActiveTrait key={a.trait.apiName} activation={a} assets={assets} />)}</div>
      <div className="mt-4 flex items-center gap-1.5 overflow-hidden">{identity.units.slice(0, 9).map((unit) => <UnitImage key={unit.apiName} unit={unit} type="icon" className="!h-9 !w-9 rounded-lg border border-white/10" />)}{identity.units.length > 9 && <span className="ml-1 text-[10px] font-bold text-slate-600">+{identity.units.length - 9}</span>}</div>
    </div>
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3 lg:flex-col lg:items-start lg:justify-center"><div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Core items</div><div className="flex gap-2">{items.map((item) => <ItemIcon key={item.apiName || item.id} item={item} src={assets.getItemIcon(item)} size="sm" />)}</div></div>
    <div className="grid grid-cols-3 gap-2 text-xs lg:grid-cols-1"><div className="rounded-lg bg-black/15 px-3 py-2"><span className="block text-[9px] uppercase tracking-wider text-slate-600">Avg place</span><b className="text-slate-100">{number(comp.overall?.avg)}</b></div><div className="rounded-lg bg-black/15 px-3 py-2"><span className="block text-[9px] uppercase tracking-wider text-slate-600">Est. pick</span><b className="text-indigo-200">{percent(comp.trends?.at(-1)?.pick)}</b></div><div className="rounded-lg bg-black/15 px-3 py-2"><span className="block text-[9px] uppercase tracking-wider text-slate-600">Place change</span><b className={change !== null && change < 0 ? 'text-emerald-300' : 'text-amber-300'}>{change === null ? 'N/A' : `${change > 0 ? '+' : ''}${number(change)}`}</b></div></div>
  </Link>
}
