import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'
import InfoCard from '../components/common/InfoCard'

const COST_STYLE = {
  1: 'text-slate-200',
  2: 'text-emerald-300',
  3: 'text-sky-300',
  4: 'text-fuchsia-300',
  5: 'text-yellow-300',
}

// Tỷ lệ ra tướng theo cấp — hằng số chung của TFT (không đổi theo set).
const SHOP_ODDS = [
  { level: 1, odds: [100, 0, 0, 0, 0] },
  { level: 2, odds: [100, 0, 0, 0, 0] },
  { level: 3, odds: [75, 25, 0, 0, 0] },
  { level: 4, odds: [55, 30, 15, 0, 0] },
  { level: 5, odds: [45, 33, 20, 2, 0] },
  { level: 6, odds: [30, 40, 25, 5, 0] },
  { level: 7, odds: [19, 30, 35, 15, 1] },
  { level: 8, odds: [18, 24, 32, 22, 4] },
  { level: 9, odds: [10, 20, 25, 35, 10] },
  { level: 10, odds: [5, 10, 20, 40, 25] },
]

export default function InfoPage() {
  const { data, error } = useTftData()
  const repo = useMemo(() => data ? createTftRepository(data) : null, [data])

  // Bảng pool tính trực tiếp từ dữ liệu tướng (poolCount = số bản mỗi tướng trong shop).
  const poolRows = useMemo(() => {
    if (!repo) return []
    const byCost = new Map()
    for (const u of repo.getUnits()) {
      if (!u.shopUnit) continue
      const cost = u.cost
      const row = byCost.get(cost) || { cost, champions: 0, copies: 0, perChampion: null }
      row.champions += 1
      if (Number.isFinite(u.poolCount)) {
        row.copies += u.poolCount
        row.perChampion = u.poolCount
      }
      byCost.set(cost, row)
    }
    return [...byCost.values()].sort((a, b) => a.cost - b.cost)
  }, [repo])

  const tierRows = useMemo(() => {
    const counts = { Silver: 0, Gold: 0, Prismatic: 0 }
    for (const a of (repo?.getAugments() || [])) if (counts[a.rarity] != null) counts[a.rarity] += 1
    return counts
  }, [repo])

  if (error) return <ErrorState />
  if (!repo) return <Loading />
  const source = repo.getSetData(); const units = repo.getUnits(); const augments = repo.getAugments()

  const topics = [
    ['shop', 'Shop Odds & Pool Sizes', 'Roll chances per level and how many copies of each champion exist in the pool.', `${units.filter((u) => u.shopUnit).length} shop champions`],
    ['augments', 'Augment Distributions', 'How augments are spread across tiers, rounds and effects.', `${augments.length} augments`],
    ['encounters', 'Opening Encounters', 'Every opening encounter and what it does at the start of the game.', `${(source.encounters || []).length} encounters`],
    ['loot', 'Rounds, Stage Loot & Orbs', 'What each stage can drop — loot, armory and orb rewards.', `${source.extras?.loot?.length || 0} loot entries`],
    ['wisps', 'Wisps', 'Set 18 mechanic values for charms and Wisp encounters.', `${source.charms?.length || 0} charms`],
    ['draven', "Draven's Bounties", 'Bounty thresholds and their gold rewards.', 'Rewards table'],
    ['coven', 'Coven Cashouts', 'Coven points and gold cashout curves.', 'Cashout table'],
    ['thiefs', "Thief's Gloves", "What the gloves give at every stage of the game.", 'Loot table'],
    ['golden-egg', 'Golden Egg', 'When the egg hatches and what it can contain.', 'Hatch timing'],
    ['booster', 'Booster Pack', 'Booster Pack variants and their possible rewards.', 'Variant table'],
  ]

  return <>
    <section className="page-head"><div><div className="eyebrow">SET 18 REFERENCE</div><h1>TFT Tables & Odds</h1><p>Quick answers for the numbers players look up most — shop odds, champion pools, augments and set mechanics.</p></div></section>

    {/* Shop odds table */}
    <div className="info-section">
      <div className="info-section-head"><div><h2>Shop odds by level</h2><p>Chance to find each cost in your shop at every level.</p></div></div>
      <div className="table-scroll">
        <table className="info-table">
          <thead><tr><th>Level</th><th>1-cost</th><th>2-cost</th><th>3-cost</th><th>4-cost</th><th>5-cost</th></tr></thead>
          <tbody>
            {SHOP_ODDS.map(({ level, odds }) => <tr key={level}>
              <td className="font-bold text-slate-100">Level {level}</td>
              {odds.map((o, i) => <td key={i} className={COST_STYLE[i + 1]}>{o}%</td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>

    {/* Pool sizes computed from data */}
    <div className="info-section">
      <div className="info-section-head"><div><h2>Champion pool by cost</h2><p>How many champions exist per cost and how many copies of each are in the shared pool.</p></div></div>
      <div className="info-kpi-grid">
        {poolRows.map((row) => <Link to="/units" key={row.cost} className="info-kpi block transition hover:-translate-y-0.5">
          <span className={COST_STYLE[row.cost]}>{row.cost}-cost</span>
          <b>{row.champions} <small className="text-sm font-bold text-slate-500">champions</small></b>
          {row.perChampion != null && <small>{row.perChampion} copies each · {row.copies.toLocaleString()} in pool</small>}
        </Link>)}
      </div>
    </div>

    {/* Augment tiers quick glance */}
    <div className="info-section">
      <div className="info-section-head"><div><h2>Augments at a glance</h2><p>How Set 18 augments split across the three tiers.</p></div><Link to="/augments" className="text-xs font-bold text-slate-500 hover:text-white">Browse augments →</Link></div>
      <div className="info-kpi-grid">
        <div className="info-kpi"><span className="text-slate-300">Silver</span><b>{tierRows.Silver}</b><small>{augments.length ? Math.round(tierRows.Silver * 100 / augments.length) : 0}% of all augments</small></div>
        <div className="info-kpi"><span className="text-yellow-300">Gold</span><b>{tierRows.Gold}</b><small>{augments.length ? Math.round(tierRows.Gold * 100 / augments.length) : 0}% of all augments</small></div>
        <div className="info-kpi"><span className="text-fuchsia-300">Prismatic</span><b>{tierRows.Prismatic}</b><small>{augments.length ? Math.round(tierRows.Prismatic * 100 / augments.length) : 0}% of all augments</small></div>
      </div>
    </div>

    <div className="info-section">
      <div className="info-section-head"><div><h2>Deep dives</h2><p>Short guides for every Set 18 mechanic — loot, encounters, cashouts and more.</p></div></div>
      <div className="info-topic-grid">{topics.map(([slug, title, desc, stat]) => <InfoCard key={slug} to={`/info/${slug}`} title={title} description={desc} stat={stat}/>)}</div>
    </div>
  </>
}
