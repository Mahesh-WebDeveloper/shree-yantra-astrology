const GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
}

export function KundliDashaStrip({
  lord,
  title,
  range,
  progress,
  hi,
}: {
  lord: string
  title: string
  range: string
  progress: number | null
  hi: boolean
}) {
  const pct = progress != null ? Math.round(progress * 100) : null
  return (
    <div className="kundli-dasha-strip">
      <div className="kundli-dasha-strip-top">
        <div className="kundli-dasha-glyph-wrap">
          <span>{GLYPH[lord] || '✦'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="kundli-dasha-eyebrow">{hi ? 'वर्तमान महादशा' : 'CURRENT MAHADASHA'}</p>
          <p className="kundli-dasha-title">{title}</p>
          <p className="kundli-dasha-range">{range}</p>
        </div>
        {pct != null ? (
          <div className="kundli-dasha-pct">
            <span className="kundli-dasha-pct-num">{pct}%</span>
            <span className="kundli-dasha-pct-sub">{hi ? 'पूर्ण' : 'done'}</span>
          </div>
        ) : null}
      </div>
      {pct != null ? (
        <div className="kundli-dasha-track">
          <div className="kundli-dasha-fill" style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
      ) : null}
    </div>
  )
}
