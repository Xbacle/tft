import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import { createAssetRepository } from '../services/assetRepository'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'
import UnitImage from '../components/units/UnitImage'
import ItemIcon from '../components/items/ItemIcon'
import AssetImage from '../components/common/AssetImage'
import { getCompIdentity } from '../utils/compNaming'
import { number, percent } from '../utils/format'
import { dataFreshnessCopy, compPlayerSummary } from '../utils/playerCopy'
import { resolveTftDescription } from '../utils/tftText'

export default function HomePage() {
  const { data, error } = useTftData()
  const repo = useMemo(() => data ? createTftRepository(data) : null, [data])
  const assets = useMemo(() => createAssetRepository(data?.assets || {}), [data])
  const featured = useMemo(() => {
    if (!repo) return { units: [], comps: [], items: [] }
    const units = [...repo.getUnits()].sort((a, b) => (a.cost || 0) - (b.cost || 0) || (a.name || '').localeCompare(b.name || '')).slice(-6)
    const comps = repo.getComps().map((comp) => ({ comp, identity: getCompIdentity(comp, repo) })).sort((a, b) => (a.comp.overall?.avg ?? 99) - (b.comp.overall?.avg ?? 99)).slice(0, 3)
    const items = [...repo.getItems()].filter((i) => i.name).slice(0, 6)
    return { units, comps, items }
  }, [repo])

  if (error) return <ErrorState />
  if (!data || !repo) return <Loading />
  const counts = repo.getDataSummary()

  return <div className="space-y-10 pb-10">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,.20),transparent_38%),radial-gradient(circle_at_82%_30%,rgba(34,211,238,.12),transparent_34%)]" />
      <div className="grid items-center lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative z-10 order-2 px-6 pb-8 pt-2 sm:px-10 lg:order-1 lg:py-12">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300/80">TFT SET 18 · ENCHANTED WILDS</div>
          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">TFT 18 <span className="text-indigo-300">HELPER</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">Champions, comps, items and an AI coach — everything about Set 18 in one place. Pick a board, check the best items, or ask the coach what to play.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/comps" className="primary-button">Explore comps</Link>
            <Link to="/units" className="secondary-button">Browse champions</Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-xs text-slate-400">
            {[['Champions', counts.units], ['Items', counts.items], ['Traits', counts.traits], ['Augments', counts.augments]].map(([label, value]) => <span key={label} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5"><b className="text-slate-200">{value}</b> {label.toLowerCase()}</span>)}
          </div>
        </div>
        <div className="relative order-1 flex min-h-[280px] items-center justify-center bg-black px-3 py-4 lg:order-2 lg:min-h-[480px]">
          <img src="/assets/home/set18-hero.png" alt="TFT Set 18" className="max-h-[480px] w-full object-contain drop-shadow-2xl" loading="eager" />
          <div className="pointer-events-none absolute inset-x-6 bottom-5 h-20 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300/70">START HERE</div>
        <h2 className="mt-2 text-2xl font-black text-white">Need an answer quickly?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Search the three things players usually care about first: who to play, what to build, and which items fit the board.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[['Champions', '/units', 'Stats, skills, roles and item usage.'], ['Comps', '/comps', 'Carry, frontline, items and active traits.'], ['Items', '/items', 'Effects, recipes and useful relationships.']].map(([label, to, text]) => <Link key={to} to={to} className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-200 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-indigo-950/10"><div className="text-sm font-black text-white group-hover:text-indigo-200">{label}</div><div className="mt-1 text-xs leading-5 text-slate-500">{text}</div></Link>)}
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/45 to-slate-950/80 p-6 shadow-lg">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300/70">GAME DATA</div>
        <h2 className="mt-2 text-2xl font-black text-white">What's inside</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{dataFreshnessCopy(counts)} Every stat, item and comp on the site follows the latest patch.</p>
        <Link to="/info" className="mt-5 inline-flex text-sm font-bold text-indigo-300 hover:text-indigo-200">Browse game tables →</Link>
      </div>
    </section>

    <section>
      <div className="mb-4 flex items-end justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300/70">CHAMPIONS</div><h2 className="mt-1 text-2xl font-black text-white">Take a closer look</h2></div><Link to="/units" className="text-xs font-bold text-slate-500 hover:text-white">View all →</Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {featured.units.map((unit) => <Link key={unit.apiName} to={`/units/${encodeURIComponent(unit.apiName)}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30"><div className="h-40 bg-black"><UnitImage unit={unit} type="splash" className="!h-full !w-full object-cover" /></div><div className="p-3"><div className="truncate text-sm font-black text-white">{unit.name}</div><div className="mt-1 text-[10px] text-slate-500">{unit.cost}-cost · {(unit.traits || []).slice(0, 2).join(' · ')}</div></div></Link>)}
      </div>
    </section>

    <section>
      <div className="mb-4 flex items-end justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300/70">COMPOSITIONS</div><h2 className="mt-1 text-2xl font-black text-white">Boards worth opening</h2><p className="mt-1 text-sm text-slate-500">Strong boards from the latest patch.</p></div><Link to="/comps" className="text-xs font-bold text-slate-500 hover:text-white">View all →</Link></div>
      <div className="grid gap-4 lg:grid-cols-3">
        {featured.comps.map(({ comp, identity }) => <Link key={comp.Cluster} to={`/comps/${comp.Cluster}`} className="group rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30"><div className="flex items-center justify-between gap-3"><h3 className="truncate text-base font-black text-white">{identity.title}</h3><span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">{identity.style}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{compPlayerSummary(identity, comp)}</p><div className="mt-4 flex flex-wrap gap-2">{identity.units.slice(0, 5).map((u) => <UnitImage key={u.apiName} unit={u} type="icon" className="!h-9 !w-9 rounded-lg border border-white/10" />)}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-black/20 p-2"><div className="text-[9px] uppercase text-slate-600">Avg</div><b className="text-sm text-white">{number(comp.overall?.avg)}</b></div><div className="rounded-xl bg-black/20 p-2"><div className="text-[9px] uppercase text-slate-600">Pick</div><b className="text-sm text-indigo-200">{percent(comp.trends?.at(-1)?.pick)}</b></div><div className="rounded-xl bg-black/20 p-2"><div className="text-[9px] uppercase text-slate-600">Games</div><b className="text-sm text-white">{comp.overall?.count?.toLocaleString() || 'N/A'}</b></div></div></Link>)}
      </div>
    </section>

    <section>
      <div className="mb-4 flex items-end justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300/70">ITEMS</div><h2 className="mt-1 text-2xl font-black text-white">Build around the basics</h2></div><Link to="/items" className="text-xs font-bold text-slate-500 hover:text-white">Browse items →</Link></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {featured.items.map((item) => <Link key={item.apiName || item.id} to={`/items/${encodeURIComponent(item.apiName || item.id)}`} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400/30"><div className="rounded-xl border border-white/10 bg-black/25 p-2"><ItemIcon item={item} src={assets.getItemIcon(item)} size="sm" /></div><div className="min-w-0"><div className="truncate text-sm font-black text-white">{item.name}</div><div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{resolveTftDescription(item, item.desc) || 'Item details are available on the detail page.'}</div></div></Link>)}
      </div>
    </section>
  </div>
}
