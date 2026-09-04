export default function TftValues({ values, title = 'Values', levelsLabel = 'Levels' }) {
  if (!values?.length) return null
  return (
    <div className="tft-values">
      <div className="tft-values-head"><strong>{title}</strong><span>{levelsLabel}</span></div>
      <div className="tft-values-grid">
        {values.map((entry) => (
          <div className="tft-values-row" key={entry.key}>
            <span>{entry.label}</span>
            <div className="flex flex-wrap justify-end gap-2">{entry.values.map((value) => <span key={`${entry.key}-${value.level}`} className="value-pill"><small>{value.level}</small>{value.value}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
