export function KundliGlancePanel({
  loading,
  items,
}: {
  loading: boolean
  items: { glyph: string; label: string; value: string }[]
}) {
  return (
    <div className="kundli-glance">
      {items.map((it) => (
        <div key={it.label} className="kundli-glance-cell">
          <div className="kundli-glance-glyph-wrap">
            <span className="kundli-glance-glyph">{it.glyph}</span>
          </div>
          <p className="kundli-glance-label">{it.label}</p>
          {loading ? (
            <div className="kundli-glance-skel" />
          ) : (
            <p className="kundli-glance-value">{it.value}</p>
          )}
        </div>
      ))}
    </div>
  )
}
