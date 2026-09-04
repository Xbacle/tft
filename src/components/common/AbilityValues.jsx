import { useMemo } from 'react'
import { formatTftValue } from '../../utils/tftText'

export default function AbilityValues({ values = [] }) {
  const rows = useMemo(() => values.map((entry) => ({ ...entry, values: [...entry.values] })).filter((entry) => entry.values.length), [values])
  if (!rows.length) return null
  const levels = [...new Set(rows.flatMap((r) => r.values.map((v) => v.level)))]
  return <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
    <div className="grid grid-cols-[1fr_repeat(4,minmax(54px,1fr))] border-b border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:px-4">
      <div>Ability value</div>{levels.slice(0, 4).map((level) => <div key={level} className="text-center">{level}★</div>)}
    </div>
    {rows.map((entry) => <div key={entry.key} className="grid grid-cols-[1fr_repeat(4,minmax(54px,1fr))] items-center border-b border-white/[0.06] px-3 py-3 last:border-b-0 sm:px-4">
      <div className="pr-3 text-xs font-bold text-slate-300">{entry.label || entry.key}</div>
      {levels.slice(0, 4).map((level) => { const v = entry.values.find((x) => Number(x.level) === Number(level)); return <div key={`${entry.key}-${level}`} className="text-center text-sm font-black text-white">{v ? formatTftValue(v.value, entry.format) : '—'}</div> })}
    </div>)}
  </div>
}
