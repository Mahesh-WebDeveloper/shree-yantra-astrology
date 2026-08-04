import type { KundliRow } from '@/data/kundliDemo'
import { cn } from '@/lib/cn'

function RowPill({ label, solid }: { label: string; solid?: boolean }) {
  return (
    <span className={cn('kundli-row-pill', solid && 'kundli-row-pill--solid')}>{label}</span>
  )
}

function Row({ row, last, alt }: { row: KundliRow; last?: boolean; alt?: boolean }) {
  return (
    <div className={cn('kundli-row', !last && 'kundli-row--border', alt && 'kundli-row--alt', row.highlight && 'kundli-row--highlight')}>
      <span className="kundli-row-glyph" aria-hidden>
        {row.glyph}
      </span>
      <div className="kundli-row-body">
        <p className="kundli-row-name">{row.name}</p>
        <p className="kundli-row-detail">{row.detail}</p>
      </div>
      {row.signGlyph ? <span className="kundli-row-sign">{row.signGlyph}</span> : null}
      <RowPill label={row.tag} solid={row.strength === 'solid'} />
    </div>
  )
}

export function KundliRowList({ rows, zebra }: { rows: KundliRow[]; zebra?: boolean }) {
  return (
    <div className="kundli-row-list">
      {rows.map((r, i) => (
        <Row key={`${r.name}-${r.tag}-${i}`} row={r} last={i === rows.length - 1} alt={!!zebra && i % 2 === 1} />
      ))}
    </div>
  )
}
