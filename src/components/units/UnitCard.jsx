import { Link } from 'react-router-dom'
import UnitImage from './UnitImage'
import Chip from '../common/Chip'

export default function UnitCard({ unit, imageType = 'icon' }) {
  return <Link className={`entity-card ${imageType === 'splash' ? 'unit-card-splash' : ''}`.trim()} to={`/units/${encodeURIComponent(unit.apiName)}`}>
    <div className={imageType === 'splash' ? 'bg-black' : ''}><UnitImage unit={unit} type={imageType} /></div>
    <div className="entity-card-body">
      <div className="flex items-center justify-between gap-2"><div className="entity-name">{unit.name || unit.en_name || 'Unknown champion'}</div><span className="tier-pill">{unit.cost ?? 'N/A'}-cost</span></div>
      <div className="chip-row mt-2">{(unit.traits || []).slice(0, 3).map((t) => <Chip key={t}>{t}</Chip>)}</div>
    </div>
  </Link>
}
