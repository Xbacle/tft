import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import { createAssetRepository } from '../services/assetRepository'
import UnitImage from '../components/units/UnitImage'
import ItemIcon from '../components/items/ItemIcon'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'
import { number, percent } from '../utils/format'
import { getCompIdentity, recentPlaceChange } from '../utils/compNaming'
import { resolveTftDescription } from '../utils/tftText'

function BuildCard({ build, repo, assets }) {
  const unit = repo.getUnit(build.unit)
  const items = (build.buildName || []).map((id) => repo.getItem(id)).filter(Boolean)
  if (!unit) return null
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-slate-950/60 p-4 transition duration-300 hover:border-indigo-400/25 hover:bg-slate-950/80">
      <div className="flex items-center gap-3">
        <UnitImage unit={unit} type="icon" className="h-12 w-12 rounded-xl border border-white/10" />
        <div className="min-w-0">
          <Link to={`/units/${unit.apiName}`} className="font-bold text-slate-100 hover:text-indigo-300">{unit.name}</Link>
          <div className="text-xs text-slate-500">{build.count ?? 'N/A'} games · Avg {number(build.avg)}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link key={item.apiName} to={`/items/${item.apiName}`} className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/25 px-2 py-2 hover:border-slate-700">
            <ItemIcon item={item} src={assets.getItemIcon(item)} size="sm" />
            <span className="text-xs text-slate-400">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ActiveTraitCard({ activation, assets }) {
  const { trait, count, nextThreshold, activeThreshold } = activation
  return <Link to={`/traits/${encodeURIComponent(trait.apiName)}`} className="group flex items-center gap-2 rounded-xl border border-white/[0.07] bg-slate-950/65 px-3 py-2 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400/30 hover:bg-slate-950">
    <img src={assets.getTraitIcon(trait)} alt={trait.name} className="h-6 w-6 shrink-0 object-contain drop-shadow-lg" loading="lazy" />
    <div className="min-w-0 flex-1"><div className="truncate text-xs font-black text-slate-100 group-hover:text-white">{trait.name}</div><div className="mt-0.5 text-[9px] text-slate-500">{count} champions on board</div></div>
    <div className="text-right"><div className="text-sm font-black text-indigo-200">{activeThreshold}</div><div className="text-[8px] uppercase tracking-wide text-slate-600">{nextThreshold ? `next ${nextThreshold}` : 'max'}</div></div>
  </Link>
}

export default function CompDetailPage() {
  const { id } = useParams()
  const { data, error } = useTftData()
  const repo = useMemo(() => data ? createTftRepository(data) : null, [data])
  const assets = useMemo(() => createAssetRepository(data?.assets || {}), [data])

  if (error) return <ErrorState />
  if (!repo) return <Loading />
  const c = repo.getComp(id)
  if (!c) return <ErrorState message="Composition not found." />

  const identity = getCompIdentity(c, repo)
  const units = repo.getCompUnits(c)
  const traitActivations = repo.getCompTraitActivations(c)
  const activeTraits = traitActivations.filter((entry) => entry.isActive)
  const items = repo.getCompItems(c)
  const placeChange = recentPlaceChange(c)

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-indigo-950/55 via-slate-950/90 to-slate-950 p-6 shadow-2xl shadow-black/20 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(99,102,241,.15),transparent_34%)]" />
        <div className="relative min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/80">TEAM COMPOSITION</div>
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3">
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">{identity.title}</h1>
            <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-200">{identity.style}</span>
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">{identity.secondary}. Start with the carry and frontline, then use the compact trait line below to see which synergies the board actually activates.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Average place', number(c.overall?.avg), 'Lower is better'],
          ['Recent place change', placeChange === null ? 'N/A' : `${placeChange > 0 ? '+' : ''}${number(placeChange)}`, 'Latest vs previous sample'],
          ['Estimated pick rate', percent(c.trends?.at(-1)?.pick), 'Latest trend point'],
          ['Games', c.overall?.count ?? 'N/A', 'Observed games'],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-slate-950/60 p-4 shadow-lg shadow-black/10">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">{label}</div>
            <div className="mt-2 text-2xl font-black text-white">{value}</div>
            <div className="mt-1 text-[11px] text-slate-500">{hint}</div>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300/70">SYNERGIES</div>
            <h2 className="mt-1 text-2xl font-black text-white">Active trait breakpoints</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">Small and quick to scan: the big number is the breakpoint this board reaches.</p>
          </div>
          <div className="hidden rounded-full border border-white/[0.07] bg-slate-950/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 md:block">{activeTraits.length} active</div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activeTraits.map((activation) => <ActiveTraitCard key={activation.trait.apiName} activation={activation} assets={assets} repo={repo} />)}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300/70">BOARD</div>
          <h2 className="mt-1 text-2xl font-black text-white">Recommended board</h2>
          <p className="mt-1 text-sm text-slate-500">These are the champions represented by the composition data. Click any unit to explore its stats, ability scaling and item usage.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {units.map((u) => (
            <Link key={u.apiName} to={`/units/${u.apiName}`} className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-950/60 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30">
              <UnitImage unit={u} type="icon" className="!h-32 !w-full !rounded-none border-b border-white/[0.06] object-cover" />
              <div className="p-3">
                <div className="truncate text-xs font-black text-slate-100 group-hover:text-white">{u.name}</div>
                <div className="mt-1 text-[10px] text-slate-500">{u.cost}-cost · {(u.traits || []).slice(0, 2).join(' · ')}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300/70">ITEMS</div>
            <h2 className="mt-1 text-2xl font-black text-white">Core items</h2>
            <p className="mt-1 text-sm text-slate-500">A quick look at the items associated with this board.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((i) => <Link key={i.apiName} to={`/items/${i.apiName}`} className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-slate-950/60 p-3 transition hover:-translate-y-0.5 hover:border-indigo-400/25"><ItemIcon item={i} src={assets.getItemIcon(i)} size="sm"/><span className="text-xs font-bold text-slate-300 group-hover:text-white">{i.name}</span></Link>)}
          </div>
        </div>
        <div>
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300/70">BUILDS</div>
            <h2 className="mt-1 text-2xl font-black text-white">Common builds</h2>
            <p className="mt-1 text-sm text-slate-500">The item combos players build most on this board.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">{(c.builds || []).slice(0, 8).map((build, index) => <BuildCard key={`${build.unit}-${index}`} build={build} repo={repo} assets={assets} />)}</div>
        </div>
      </section>
    </>
  )
}
