import { useMemo } from 'react'
import type { ApiPlanet } from '@/lib/api'
import {
  HOUSES,
  SOUTH_CELL,
  type ChartStyle,
  planetsBySign,
  rashiOfHouse,
  signAbbr,
  toChartPlanetsBySign,
} from '@/data/kundliChart'
import { useLang } from '@/i18n/LangProvider'

function PToken({ x, y, label }: { x: number; y: number; label: string }) {
  const w = label.length * 4.6 + 4
  return (
    <g>
      <rect x={x - w / 2} y={y - 7.6} width={w} height={9.8} rx={2.4} className="chart-planet-chip" />
      <text x={x} y={y} className="chart-planet-text" textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

function NToken({ x, y, label }: { x: number; y: number; label: string }) {
  const w = label.length * 6.2 + 6
  return (
    <g>
      <rect x={x - w / 2} y={y - 9} width={w} height={12.6} rx={2.8} className="chart-house-chip" />
      <text x={x} y={y} className="chart-house-text" textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

export function BirthChart({
  style = 'north',
  planets,
  ascendant,
  className,
}: {
  style?: ChartStyle
  planets: ApiPlanet[]
  ascendant?: string | null
  className?: string
}) {
  const { hi } = useLang()
  const northPlanets = useMemo(() => toChartPlanetsBySign(planets, ascendant, hi), [planets, ascendant, hi])
  const bySign = useMemo(() => (style !== 'north' ? planetsBySign(planets, hi) : {}), [style, planets, hi])
  const lagnaIdx = ascendant ? { Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5, Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11 }[ascendant] ?? -1 : -1

  return (
    <div className={`birth-chart-wrap ${className ?? ''}`}>
      <svg viewBox="0 0 200 200" className="birth-chart-svg" aria-label="Birth chart">
        <defs>
          <linearGradient id="kg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-gold-a)" />
            <stop offset="60%" stopColor="var(--chart-gold-b)" />
            <stop offset="100%" stopColor="var(--chart-gold-c)" />
          </linearGradient>
        </defs>
        <rect x={10} y={10} width={180} height={180} rx={3} className="chart-backdrop" />
        {style === 'south' ? (
          <>
            <rect x={10} y={10} width={180} height={180} stroke="url(#kg)" strokeWidth={1.5} fill="none" />
            {[1, 2, 3].map((i) => (
              <line key={`v${i}`} x1={10 + i * 45} y1={10} x2={10 + i * 45} y2={190} stroke="url(#kg)" strokeWidth={1.1} />
            ))}
            {[1, 2, 3].map((i) => (
              <line key={`h${i}`} x1={10} y1={10 + i * 45} x2={190} y2={10 + i * 45} stroke="url(#kg)" strokeWidth={1.1} />
            ))}
            {Object.keys(SOUTH_CELL).map((si) => {
              const idx = Number(si)
              const [r, col] = SOUTH_CELL[idx]
              const x0 = 10 + col * 45
              const y0 = 10 + r * 45
              const cx = x0 + 22.5
              const isLagna = idx === lagnaIdx
              const pls = bySign[idx] || []
              return (
                <g key={si}>
                  <text x={x0 + 4} y={y0 + 11} className={isLagna ? 'chart-sign-lagna' : 'chart-sign-label'} textAnchor="start">
                    {signAbbr(idx, hi)}
                  </text>
                  {pls.map((ab, i) => (
                    <PToken
                      key={`${ab}${i}`}
                      x={pls.length > 1 ? cx + ((i % 2) * 20 - 10) : cx}
                      y={y0 + 27 + Math.floor(i / 2) * 9}
                      label={ab}
                    />
                  ))}
                </g>
              )
            })}
          </>
        ) : style === 'east' ? (
          <>
            <rect x={10} y={10} width={180} height={180} stroke="url(#kg)" strokeWidth={1.5} fill="none" />
            <line x1={10} y1={10} x2={190} y2={190} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={190} y1={10} x2={10} y2={190} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={100} y1={10} x2={190} y2={100} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={190} y1={100} x2={100} y2={190} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={100} y1={190} x2={10} y2={100} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={10} y1={100} x2={100} y2={10} stroke="url(#kg)" strokeWidth={1.1} />
            {HOUSES.map((h) => {
              const signIdx = h.n - 1
              const isLagna = signIdx === lagnaIdx
              const pls = bySign[signIdx] || []
              return (
                <g key={`e${h.n}`}>
                  <text x={h.x} y={h.y - 4} className={isLagna ? 'chart-sign-lagna' : 'chart-sign-label'} textAnchor="middle">
                    {signAbbr(signIdx, hi)}
                    {isLagna ? ' ◹' : ''}
                  </text>
                  {pls.map((ab, i) => (
                    <PToken
                      key={`${ab}${i}`}
                      x={h.x + (pls.length > 1 ? (i % 2) * 18 - 9 : 0)}
                      y={h.y + 8 + Math.floor(i / 2) * 9}
                      label={ab}
                    />
                  ))}
                </g>
              )
            })}
          </>
        ) : (
          <>
            <rect x={10} y={10} width={180} height={180} stroke="url(#kg)" strokeWidth={1.5} fill="none" />
            <line x1={10} y1={10} x2={190} y2={190} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={190} y1={10} x2={10} y2={190} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={100} y1={10} x2={190} y2={100} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={190} y1={100} x2={100} y2={190} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={100} y1={190} x2={10} y2={100} stroke="url(#kg)" strokeWidth={1.1} />
            <line x1={10} y1={100} x2={100} y2={10} stroke="url(#kg)" strokeWidth={1.1} />
            {northPlanets.map((p) => (
              <PToken key={`${p.abbr}-${p.x}-${p.y}`} x={p.x} y={p.y} label={p.abbr} />
            ))}
            {HOUSES.map((h) => (
              <NToken key={`h${h.n}`} x={h.x} y={h.y} label={String(rashiOfHouse(h.n, ascendant))} />
            ))}
          </>
        )}
      </svg>
    </div>
  )
}
