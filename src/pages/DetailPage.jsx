import { Link, useLocation, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useTftData } from '../services/dataLoader'
import { createTftRepository } from '../services/tftRepository'
import { createAssetRepository, isRadiantItem } from '../services/assetRepository'
import AssetImage from '../components/common/AssetImage'
import PlaceholderIcon from '../components/common/PlaceholderIcon'
import Chip from '../components/common/Chip'
import TftValues from '../components/common/TftValues'
import AbilityValues from '../components/common/AbilityValues'
import UnitCard from '../components/units/UnitCard'
import CompRow from '../components/comps/CompRow'
import UnitImage from '../components/units/UnitImage'
import ItemIcon from '../components/items/ItemIcon'
import AugmentTierFrame from '../components/augments/AugmentTierFrame'
import { number, percent, valueOrNA } from '../utils/format'
import { extractAllCurveValues, extractTftValues, resolveTftDescription, resolveUnitAbility } from '../utils/tftText'
import { humanizeId, humanizeTag, roleLabel } from '../utils/labels'
import { getItemKind, itemKindLabel } from '../utils/itemType'
import { championOverview, championUsageHint, itemPlayerSummary, traitPlayerSummary, augmentPlayerSummary } from '../utils/playerCopy'
import Loading from '../components/common/Loading'
import ErrorState from '../components/common/ErrorState'

function Section({ title, intro, children, action }) { return <section className="detail-section"><div className="mb-4 flex items-end justify-between gap-3"><div><h2>{title}</h2>{intro && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{intro}</p>}</div>{action}</div>{children}</section> }

function RelationGrid({ items, kind, assets }) {
  return <div className="detail-grid">{items.map((x) => {
    if (kind === 'unit') return <UnitCard key={x.apiName} unit={x} imageType="icon" />
    if (kind === 'trait') return <Link key={x.apiName} className="entity-card" to={`/traits/${x.apiName}`}><div className="trait-card-icon-clean"><AssetImage src={assets.getTraitIcon(x)} alt={x.name} label={x.name} className="h-16 w-16 object-contain" /></div><div className="entity-card-body"><div className="entity-name">{x.name}</div></div></Link>
    return <Link key={x.apiName || x.id} className="entity-card" to={`/items/${x.apiName || x.id}`}><div className="item-card-icon"><ItemIcon item={x} src={assets.getItemIcon(x)} size="lg"/></div><div className="entity-card-body"><div className="entity-name">{x.name}</div></div></Link>
  })}</div>
}

function DetailHero({ name, meta, unit, iconSrc, fallbackIcon, augment, children, item }) {
  let visual = null
  if (unit) visual = <UnitImage unit={unit} type="splash" className="detail-unit-splash" />
  else if (augment) visual = <AugmentTierFrame rarity={augment.rarity} icon={iconSrc} fallbackIcon={fallbackIcon} name={name} className="detail-augment-icon" />
  else if (item) visual = <div className={isRadiantItem(item) ? 'detail-item-radiant' : 'detail-item-icon'}><ItemIcon item={item} src={iconSrc} size="lg" /></div>
  else if (iconSrc) visual = <AssetImage src={iconSrc} alt={name} label={name} className="h-20 w-20 object-contain" fallbackSize="lg" />
  else visual = <PlaceholderIcon label={name} size="lg" />
  return <section className="detail-hero"><div className="shrink-0">{visual}</div><div className="min-w-0"><div className="eyebrow">{meta}</div><h1>{name}</h1>{children}</div></section>
}

function formatStatValue(key, value) {
  if (Array.isArray(value)) return value.join(' / ')
  if (typeof value !== 'number') return String(value)
  if (key === 'critChance') return `${number(value * 100)}%`
  if (key === 'critMultiplier') return `${number(value, 2)}x`
  if (key === 'attackSpeed') return `${number(value, 2)} / sec`
  return Number.isInteger(value) ? String(value) : number(value, 2)
}

function humanizeStats(stats = {}) {
  const order = ['hp', 'damage', 'attackSpeed', 'armor', 'magicResist', 'initialMana', 'mana', 'range', 'critChance', 'critMultiplier']
  return Object.entries(stats).filter(([, v]) => v !== null && v !== undefined).sort(([a], [b]) => (order.indexOf(a) < 0 ? 999 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 999 : order.indexOf(b))).map(([key, value]) => ({ label: humanizeId(key), value: formatStatValue(key, value) }))
}

function StarDamageTable({ damageByStar = [] }) {
  if (!damageByStar.length) return null
  return <div className="star-damage-table"><div className="star-damage-head"><span>Attack Damage</span><span>1★</span><span>2★</span><span>3★</span><span>4★</span></div><div className="star-damage-row"><strong>AD</strong>{[0,1,2,3].map((i) => <span key={i}>{damageByStar[i] ?? '—'}</span>)}</div></div>
}

export default function DetailPage({ forcedKind }) {
  const { id: rawId } = useParams(); const id = decodeURIComponent(rawId || ''); const location = useLocation(); const kind = forcedKind || location.pathname.split('/')[1]
  const { data, error } = useTftData(); const repo = useMemo(() => data ? createTftRepository(data) : null, [data]); const assets = useMemo(() => createAssetRepository(data?.assets || {}), [data])
  if (error) return <ErrorState />; if (!data || !repo) return <Loading />

  let entity = null
  if (kind === 'units') entity = repo.getUnit(id)
  if (kind === 'items') entity = repo.getItem(id)
  if (kind === 'traits') entity = repo.getTrait(id)
  if (kind === 'augments') entity = repo.getAugment(id)
  if (!entity) return <ErrorState message={`${kind?.slice(0, -1) || 'Entity'} not found.`} />
  const name = entity.name || entity.en_name || 'N/A'; const roleData = repo.getRoleData()

  if (kind === 'units') {
    const stats = repo.getUnitStats(entity); const related = repo.getRelatedCompsForUnit(entity); const ability = resolveUnitAbility(entity); const recommendedItems = (stats?.items || []).map((x) => repo.getItem(x.itemName)).filter(Boolean); const role = roleLabel(entity.role, roleData); const roleInfo = roleData?.[entity.role]
    return <>
      <DetailHero name={name} unit={entity} meta={`${entity.cost ?? 'N/A'}-cost · ${role}`}><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{championOverview(entity, repo)}</p><div className="chip-row mt-3">{(entity.traits || []).map((t, i) => <Link key={`${t}-${i}`} to={`/traits/${entity.traitApiNames?.[i] || t}`}><Chip>{t}</Chip></Link>)}</div></DetailHero>
      <Section title="At a glance" intro="Core combat numbers from the current champion record."><div className="stat-table">{humanizeStats(entity.stats).map((row) => <div key={row.label}><span>{row.label}</span><b>{row.value}</b></div>)}<div><span>Shop tier</span><b>{entity.shopTier ?? 'N/A'}</b></div><div><span>Copies in pool</span><b>{entity.poolCount ?? 'N/A'}</b></div><div><span>Pool cost</span><b>{entity.poolCost ?? entity.cost ?? 'N/A'} gold</b></div><div><span>Role</span><b>{role}</b></div></div><StarDamageTable damageByStar={entity.stats?.damageByStar} /></Section>
      {roleInfo?.desc && <Section title={`How the role works · ${role}`} intro="What this role plays like."><div className="soft-panel"><p>{resolveTftDescription(roleInfo, roleInfo.desc)}</p></div></Section>}
      <Section title={`Ability · ${ability.name}`} intro="Read the effect first, then scan the star-by-star values below."><div className="ability-panel"><p className="ability-description">{ability.description}</p><AbilityValues values={ability.values}/></div><TftValues values={extractAllCurveValues({ ...entity, ...(entity.ability || {}), curveValues: { ...(entity.curveValues || {}), ...(entity.ability?.curveValues || {}) }, curveTable: { ...(entity.curveTable || {}), ...(entity.ability?.curveTable || {}) }})} title="Additional ability data" /></Section>
      {recommendedItems.length > 0 && <Section title="Common item choices" intro="Popular item builds for this champion."><RelationGrid items={recommendedItems.slice(0, 12)} kind="item" assets={assets}/></Section>}
      {stats && <Section title="Match stats" intro={championUsageHint(entity, stats)}><div className="stat-table"><div><span>Games</span><b>{stats.count ?? 'N/A'}</b></div><div><span>Average place</span><b>{number(stats.avg)}</b></div><div><span>Pick rate</span><b>{percent(stats.pick)}</b></div><div><span>Placement sample</span><b>{stats.place ?? 'N/A'}</b></div></div></Section>}
      {related.length > 0 && <Section title="Compositions featuring this champion"><div className="comp-list">{related.slice(0, 8).map((c) => <CompRow key={c.Cluster} comp={c} repo={repo}/>)}</div></Section>}
    </>
  }

  if (kind === 'items') {
    const stats = repo.getItemStats(entity); const relatedUnits = repo.getRelatedUnitsForItem(entity); const relatedComps = repo.getRelatedCompsForItem(entity); const description = resolveTftDescription(entity, entity.desc); const values = extractTftValues(entity, entity.desc); const components = repo.getComponentsForItem(entity); const upgrade = repo.getUpgradeItem(entity); const base = repo.getBaseItem(entity); const associated = repo.getAssociatedTraits(entity); const incompatible = repo.getIncompatibleTraits(entity); const kindLabel = itemKindLabel(getItemKind(entity))
    return <>
      <DetailHero name={name} iconSrc={assets.getItemIcon(entity)} meta={`${kindLabel}${isRadiantItem(entity) ? ' · Radiant' : ''}`} item={entity}/>
      <Section title="What this item does" intro={itemPlayerSummary(entity, stats, kindLabel)}><div className="soft-panel"><p>{description}</p></div>{entity.statLine && <div className="mt-4 soft-panel"><b className="text-slate-100">Stat line</b><p className="mt-2 text-sm text-slate-300">{resolveTftDescription(entity, entity.statLine)}</p></div>}<TftValues values={values} title="Values referenced in the description"/><TftValues values={extractAllCurveValues(entity)} title="Additional item values"/></Section>
      <Section title="Recipe & relationships" intro="See what it builds from, what it upgrades into, and which traits it is tied to."><div className="stat-table"><div><span>Type</span><b>{kindLabel}</b></div><div><span>Base item</span><b>{base?.name || 'None'}</b></div><div><span>Upgrade</span><b>{upgrade?.name || 'None'}</b></div><div><span>Unique</span><b>{entity.unique ? 'Yes' : 'No'}</b></div></div>{components.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{components.map((c) => <Link key={c.apiName} to={`/items/${c.apiName}`} className="mini-entity"><ItemIcon item={c} src={assets.getItemIcon(c)} size="sm"/><span>{c.name}</span></Link>)}</div>}</Section>
      {associated.length > 0 && <Section title="Trait-linked item"><RelationGrid items={associated} kind="trait" assets={assets}/></Section>}
      {stats && <Section title="Match stats" intro="How this item performs in recent matches."><div className="stat-table"><div><span>Games</span><b>{stats.count ?? 'N/A'}</b></div><div><span>Average place</span><b>{number(stats.avg)}</b></div><div><span>Observed placements</span><b>{stats.place ?? 'N/A'}</b></div><div><span>Linked champions</span><b>{relatedUnits.length}</b></div></div></Section>}
      {relatedUnits.length > 0 && <Section title="Champions using this item"><RelationGrid items={relatedUnits.slice(0, 15)} kind="unit" assets={assets}/></Section>}
      {relatedComps.length > 0 && <Section title="Compositions using this item"><div className="comp-list">{relatedComps.slice(0, 8).map((c) => <CompRow key={c.Cluster} comp={c} repo={repo}/>)}</div></Section>}
    </>
  }

  if (kind === 'traits') {
    const units = repo.getRelatedUnitsForTrait(entity); const relatedComps = repo.getRelatedCompsForTrait(entity); const description = resolveTftDescription(entity, entity.desc); const values = extractTftValues(entity, entity.desc); const curve = extractAllCurveValues(entity)
    return <>
      <DetailHero name={name} iconSrc={assets.getTraitIcon(entity)} meta={`${entity.type || 'Trait'} · ${units.length} champions`}/>
      <Section title="What this trait does" intro={traitPlayerSummary(entity, units.length)}><div className="stat-table"><div><span>Type</span><b>{entity.type || 'Trait'}</b></div><div><span>Champions</span><b>{units.length}</b></div><div><span>Breakpoints</span><b>{entity.effects?.length || 0}</b></div></div><div className="mt-4 soft-panel"><p>{description}</p></div></Section>
      <Section title="Breakpoints" intro="Reach a threshold by fielding enough champions with this trait. Each effect below comes directly from the current source."><div className="effect-list">{(entity.effects || []).map((effect, index) => <div key={index}><div className="flex flex-wrap items-center gap-2"><span className="tier-pill">{effect.minUnits ?? 'N/A'} champions</span><span className="text-xs text-slate-500">through {effect.maxUnits ?? 'N/A'}</span></div><p className="mt-3 text-sm leading-6 text-slate-300">{resolveTftDescription(entity, effect.desc || effect.name || entity.desc)}</p><TftValues values={extractTftValues(entity, effect.desc || '')} title="Threshold values"/></div>)}</div></Section>
      {values.length > 0 && <Section title="Values referenced by the trait"><TftValues values={values}/></Section>}
      {curve.length > 0 && <Section title="Additional trait numbers"><TftValues values={curve}/></Section>}
      <Section title="Champions with this trait" intro="These are the shop champions that list this trait in their current records."><RelationGrid items={units} kind="unit" assets={assets}/></Section>
      {relatedComps.length > 0 && <Section title="Compositions using this trait"><div className="comp-list">{relatedComps.slice(0, 12).map((c) => <CompRow key={c.Cluster} comp={c} repo={repo}/>)}</div></Section>}
    </>
  }

  const description = resolveTftDescription(entity, entity.desc); const values = extractTftValues(entity, entity.desc); const curve = extractAllCurveValues(entity); const associated = repo.getAssociatedTraits(entity); const incompatible = repo.getIncompatibleTraits(entity); const augmentAsset = assets.getAugmentRarityIcon(entity); const categories = [...(entity.tags || []), ...(entity.manual_tags || [])].filter((x) => /Category|Variant|Complexity|Mode/i.test(x)).map(humanizeTag).filter(Boolean)
  return <>
    <DetailHero name={name} iconSrc={augmentAsset} fallbackIcon={assets.getAugmentIcon(entity)} augment={entity} meta={`${entity.rarity || 'Augment'} · ${entity.type || 'Regular'}`}><div className="chip-row mt-3">{categories.slice(0, 6).map((x, i) => <Chip key={`${x}-${i}`}>{x}</Chip>)}</div></DetailHero>
    <Section title="What this augment does" intro={augmentPlayerSummary(entity)}><div className="soft-panel"><p>{description}</p></div><TftValues values={values} title="Values referenced by the description"/><TftValues values={curve} title="Additional augment values"/></Section>
    <Section title="When and how it appears"><div className="stat-table"><div><span>Tier</span><b>{valueOrNA(entity.rarity)}</b></div><div><span>Rounds</span><b>{(entity.rounds || []).join(' · ') || 'Not specified'}</b></div><div><span>Timing</span><b>{(entity.roundVariants || []).join(' · ') || 'Not specified'}</b></div><div><span>Unique</span><b>{entity.unique ? 'Yes' : 'No'}</b></div><div><span>Type</span><b>{entity.type || 'Regular'}</b></div><div><span>Categories</span><b>{categories.join(' · ') || 'N/A'}</b></div></div></Section>
    {associated.length > 0 && <Section title="Associated traits"><RelationGrid items={associated} kind="trait" assets={assets}/></Section>}
    {incompatible.length > 0 && <Section title="Incompatible traits"><div className="chip-row">{incompatible.map((t) => <Link key={t.apiName} to={`/traits/${t.apiName}`}><Chip>{t.name}</Chip></Link>)}</div></Section>}
  </>
}
