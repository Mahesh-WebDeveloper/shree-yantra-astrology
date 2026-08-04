import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { VargaChart } from '@/lib/api'
import { BirthChart } from '@/components/kundli/BirthChart'
import type { ChartStyle } from '@/data/kundliChart'
import { aPlanet, aSign } from '@/lib/astroLabels'
import { useLang } from '@/i18n/LangProvider'

const CHART_STYLES: ChartStyle[] = ['north', 'south', 'east']

export function VargaChartCard({
  chart,
  onOpen,
}: {
  chart: VargaChart
  onOpen: (chart: VargaChart) => void
  onAsk?: (chart: VargaChart) => void
}) {
  const { hi, lang } = useLang()
  const [localStyle, setLocalStyle] = useState<ChartStyle>('north')
  const effectiveStyle = localStyle === 'north' && !chart.ascendantSign ? 'south' : localStyle

  const important = [
    chart.ascendantSign ? { planet: 'Lagna', sign: chart.ascendantSign } : null,
    ...['Sun', 'Moon', 'Jupiter', 'Venus', 'Saturn', 'Mars']
      .map((name) => chart.planets.find((p) => p.planet === name))
      .filter(Boolean),
  ]
    .filter(Boolean)
    .slice(0, 6) as { planet: string; sign?: string | null }[]

  const askHref = `/ai-astrologer?q=${encodeURIComponent(
    `Explain my ${chart.name} (${chart.code}) in simple language. Focus on ${chart.area}.`,
  )}`

  return (
    <div className="kundli-varga-card sy-stat-tile">
      <div className="kundli-varga-head">
        <p className="kundli-varga-code">{chart.code}</p>
        <h3 className="font-display text-lg font-semibold text-[var(--sy-accent)]">
          {hi && chart.nameHi ? chart.nameHi : chart.name}
        </h3>
        {chart.sanskrit ? <p className="text-xs text-[var(--sy-text-muted)]">{chart.sanskrit}</p> : null}
      </div>

      <div className="kundli-varga-style-bar">
        {CHART_STYLES.map((key) => (
          <button
            key={key}
            type="button"
            className={`kundli-tab-pill ${localStyle === key ? 'kundli-tab-pill--on' : ''}`}
            onClick={() => setLocalStyle(key)}
          >
            {key === 'north' ? (hi ? 'उत्तर' : 'North') : key === 'south' ? (hi ? 'दक्षिण' : 'South') : hi ? 'पूर्व' : 'East'}
          </button>
        ))}
      </div>

      <div className="kundli-varga-body">
        <button type="button" className="kundli-varga-chart-hit" onClick={() => onOpen(chart)}>
          <BirthChart style={effectiveStyle} planets={chart.planets} ascendant={chart.ascendantSign} className="mx-auto max-w-[220px]" />
          <span className="kundli-varga-expand" aria-hidden>
            ⤢
          </span>
        </button>
        <div className="kundli-varga-chips">
          {important.map((p) => (
            <div key={`${chart.code}-${p.planet}`} className="kundli-varga-chip">
              <span className="kundli-varga-chip-name">
                {p.planet === 'Lagna' ? (hi ? 'लग्न' : 'Lagna') : aPlanet(p.planet, lang)}
              </span>
              <span>{p.sign ? aSign(p.sign, lang) : '—'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="kundli-varga-info">
        <p className="kundli-varga-info-label">{hi ? 'क्या दिखाता है' : 'What it shows'}</p>
        <p className="text-sm">{hi && chart.areaHi ? chart.areaHi : chart.area}</p>
        {chart.why || chart.whyHi ? (
          <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{hi && chart.whyHi ? chart.whyHi : chart.why}</p>
        ) : null}
      </div>

      <Link to={askHref} className="kundli-varga-ask">
        {hi ? 'इस चार्ट को समझाएँ' : 'Explain this'}
      </Link>
    </div>
  )
}
