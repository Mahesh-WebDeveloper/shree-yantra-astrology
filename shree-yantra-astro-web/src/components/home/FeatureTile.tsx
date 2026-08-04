import { Link } from 'react-router-dom'
import { useSpotlight } from '@/hooks/useSpotlight'

export function FeatureTile({
  to,
  accent,
  glyph,
  title,
  desc,
}: {
  to: string
  accent: string
  glyph: string
  title: string
  desc: string
}) {
  const { ref, onMouseMove } = useSpotlight<HTMLAnchorElement>()
  return (
    <Link
      ref={ref}
      to={to}
      onMouseMove={onMouseMove}
      className="feature-tile group"
      style={{ ['--feature-accent' as string]: accent }}
    >
      <span className="feature-spotlight" aria-hidden />
      <span className="feature-icon-wrap relative z-10">{glyph}</span>
      <h3 className="relative z-10 text-[15px] font-semibold tracking-tight text-[var(--sy-text)]">{title}</h3>
      <p className="relative z-10 text-[13px] leading-relaxed text-[var(--sy-text-muted)]">{desc}</p>
      <span className="relative z-10 mt-auto text-xs font-medium text-[var(--sy-accent)] opacity-0 transition group-hover:opacity-100">
        →
      </span>
    </Link>
  )
}
